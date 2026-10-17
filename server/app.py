"""SQLite demo backend. Python 3.10+. Run `python server/app.py` from project root."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from http.cookies import SimpleCookie
from pathlib import Path
import sqlite3, json, hashlib, hmac, secrets, datetime, os, time, threading

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.environ.get('INTHANIN_DB', ROOT / 'server' / 'inthanin.sqlite3'))
PORT = int(os.environ.get('PORT', '8000'))
SECURE_COOKIE = os.environ.get('HTTPS', '') == '1'
LOCK = threading.RLock()

def connection():
    c = sqlite3.connect(DB_PATH, timeout=15)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    return c

def hashed(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 260000)
    return salt.hex() + ':' + key.hex()

def verify(password, stored):
    try:
        salt, digest = stored.split(':')
        return hmac.compare_digest(hashed(password, bytes.fromhex(salt)).split(':')[1], digest)
    except Exception:
        return False

def init():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connection() as c:
        c.executescript('''
        CREATE TABLE IF NOT EXISTS members (
          id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL,
          points INTEGER NOT NULL DEFAULT 5 CHECK(points>=0),
          welcome INTEGER NOT NULL DEFAULT 1, sweetness INTEGER NOT NULL DEFAULT 50,
          ck_days INTEGER NOT NULL DEFAULT 0, ck_last TEXT, day_offset INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY, member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
          expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS redemptions (
          id INTEGER PRIMARY KEY, member_id INTEGER NOT NULL REFERENCES members(id),
          reward_id TEXT NOT NULL, points_spent INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS checkins (
          id INTEGER PRIMARY KEY, member_id INTEGER NOT NULL REFERENCES members(id),
          checkin_date TEXT NOT NULL, points_awarded INTEGER NOT NULL,
          UNIQUE(member_id, checkin_date)
        );
        ''')
        # Preserve the original demo login only for local development.
        if os.environ.get('SEED_DEMO','1') == '1':
            c.execute('INSERT OR IGNORE INTO members(name,phone,email,password_hash) VALUES(?,?,?,?)',
                      ('ผู้ประกอบการ','0800000000','test@gmail.com',hashed('12345678')))

def member(c, uid):
    row = c.execute('SELECT * FROM members WHERE id=?',(uid,)).fetchone()
    if not row: return None
    rewards = [r[0] for r in c.execute('SELECT reward_id FROM redemptions WHERE member_id=? ORDER BY id',(uid,))]
    return {'name':row['name'],'phone':row['phone'],'email':row['email'], 'points':row['points'],
            'welcome':row['welcome'],'sweetness':row['sweetness'],
            'ck':{'n':row['ck_days'],'last':row['ck_last']},'myRw':rewards}

# Reward IDs and costs mirror js/data/store.js; don't trust costs submitted by clients.
REWARDS = {'drink': 10, 'bag': 30}
# Inject exact list from static project data at build time.

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, fmt, *args):
        print('%s %s' % (self.address_string(), fmt % args))
    def send_json(self, status, value, cookie=None):
        raw=json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(raw)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        if cookie: self.send_header('Set-Cookie', cookie)
        self.end_headers();self.wfile.write(raw)
    def cookie_token(self):
        try:
            c=SimpleCookie();c.load(self.headers.get('Cookie',''))
            return c['inthanin_session'].value if 'inthanin_session' in c else None
        except Exception:return None
    def current_id(self,c):
        tok=self.cookie_token()
        if not tok:return None
        digest=hashlib.sha256(tok.encode()).hexdigest()
        row=c.execute('SELECT member_id FROM sessions WHERE token_hash=? AND expires_at>?',(digest,int(time.time()))).fetchone()
        return row[0] if row else None
    def do_GET(self):
        if self.path=='/api/me':
            with connection() as c:
                uid=self.current_id(c)
                return self.send_json(200,member(c,uid) if uid else None)
        if self.path.startswith('/api/'):
            return self.send_json(404,{'error':'ไม่พบ API'})
        if self.path.split('?')[0]=='/':self.path='/index.html'
        return super().do_GET()
    def do_POST(self):
        if not self.path.startswith('/api/'):
            return self.send_json(404,{'error':'ไม่พบ API'})
        try:
            size=int(self.headers.get('Content-Length','0'))
            if size>20000 or size<0: return self.send_json(413,{'error':'ข้อมูลใหญ่เกินไป'})
            data=json.loads(self.rfile.read(size) or b'{}')
            if not isinstance(data,dict):raise ValueError()
        except Exception:
            return self.send_json(400,{'error':'รูปแบบข้อมูลไม่ถูกต้อง'})
        try:
            with LOCK, connection() as c:
                if self.path=='/api/register':
                    name=str(data.get('name','')).strip()[:150];phone=str(data.get('phone','')).strip()[:30]
                    email=str(data.get('email','')).strip().lower()[:254];pw=str(data.get('password',''))
                    if not name or not phone or '@' not in email or len(pw)<8 or len(pw)>256:return self.send_json(400,{'error':'กรอกข้อมูลไม่ครบหรือรหัสผ่านสั้นเกินไป'})
                    try:
                        c.execute('INSERT INTO members(name,phone,email,password_hash) VALUES(?,?,?,?)',(name,phone,email,hashed(pw)))
                    except sqlite3.IntegrityError:return self.send_json(409,{'error':'อีเมลนี้ถูกใช้แล้ว'})
                    return self.send_json(201,{'ok':True})
                if self.path=='/api/login':
                    email=str(data.get('email','')).strip().lower(); pw=str(data.get('password',''))
                    row=c.execute('SELECT id,password_hash FROM members WHERE email=?',(email,)).fetchone()
                    if not row or not verify(pw,row['password_hash']):return self.send_json(401,{'error':'อีเมลหรือรหัสผ่านไม่ถูกต้อง'})
                    token=secrets.token_urlsafe(32)
                    c.execute('INSERT INTO sessions(token_hash,member_id,expires_at) VALUES(?,?,?)',
                              (hashlib.sha256(token.encode()).hexdigest(),row['id'],int(time.time())+604800))
                    cookie='inthanin_session='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800'+('; Secure' if SECURE_COOKIE else '')
                    return self.send_json(200,member(c,row['id']),cookie)
                uid=self.current_id(c)
                if self.path=='/api/logout':
                    tok=self.cookie_token()
                    if tok:c.execute('DELETE FROM sessions WHERE token_hash=?',(hashlib.sha256(tok.encode()).hexdigest(),))
                    return self.send_json(200,{'ok':True},'inthanin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'+('; Secure' if SECURE_COOKIE else ''))
                if not uid:return self.send_json(401,{'error':'กรุณาเข้าสู่ระบบ'})
                if self.path=='/api/welcome':
                    c.execute('UPDATE members SET welcome=0 WHERE id=?',(uid,))
                    return self.send_json(200,{'ok':True})
                if self.path=='/api/sweetness':
                    value=int(data.get('sweetness',-1))
                    if value not in [0,25,50,75,100]:return self.send_json(400,{'error':'ค่าความหวานไม่ถูกต้อง'})
                    c.execute('UPDATE members SET sweetness=? WHERE id=?',(value,uid))
                    return self.send_json(200,member(c,uid))
                if self.path=='/api/dev/advance-day':
                    if os.environ.get('ENABLE_DEMO_CLOCK','0')!='1':return self.send_json(403,{'error':'ฟังก์ชันทดสอบวันถูกปิดอยู่'})
                    c.execute('UPDATE members SET day_offset=day_offset+1 WHERE id=?',(uid,))
                    return self.send_json(200,{'ok':True})
                if self.path=='/api/checkin':
                    row=c.execute('SELECT ck_days,ck_last,day_offset FROM members WHERE id=?',(uid,)).fetchone()
                    date=datetime.date.today()+datetime.timedelta(days=row['day_offset']);today=date.isoformat()
                    if row['ck_last']==today:return self.send_json(200,{'checked_in':False,'member':member(c,uid)})
                    old=datetime.date.fromisoformat(row['ck_last']) if row['ck_last'] else None
                    n=0 if not old or (date-old).days>1 or row['ck_days']>=7 else row['ck_days']
                    n+=1
                    c.execute('INSERT INTO checkins(member_id,checkin_date,points_awarded) VALUES(?,?,5)',(uid,today))
                    c.execute('UPDATE members SET ck_days=?,ck_last=?,points=points+5 WHERE id=?',(n,today,uid))
                    return self.send_json(200,{'checked_in':True,'member':member(c,uid)})
                if self.path=='/api/redeem':
                    rid=str(data.get('reward_id',''))
                    cost=REWARDS.get(rid)
                    if cost is None:return self.send_json(400,{'error':'ไม่พบรางวัล'})
                    result=c.execute('UPDATE members SET points=points-? WHERE id=? AND points>=?',(cost,uid,cost))
                    if result.rowcount==0:return self.send_json(400,{'error':'คะแนนไม่เพียงพอ'})
                    c.execute('INSERT INTO redemptions(member_id,reward_id,points_spent) VALUES(?,?,?)',(uid,rid,cost))
                    return self.send_json(200,member(c,uid))
                return self.send_json(404,{'error':'ไม่พบ API'})
        except (ValueError,TypeError):
            return self.send_json(400,{'error':'ข้อมูลไม่ถูกต้อง'})
        except sqlite3.IntegrityError:
            return self.send_json(409,{'error':'รายการนี้ถูกบันทึกแล้ว'})
        except Exception as exc:
            print('Server error:',repr(exc))
            return self.send_json(500,{'error':'เซิร์ฟเวอร์เกิดข้อผิดพลาด'})

if __name__=='__main__':
    init()
    print('Inthanin SQLite: http://127.0.0.1:%d' % PORT)
    ThreadingHTTPServer(('127.0.0.1',PORT),Handler).serve_forever()
