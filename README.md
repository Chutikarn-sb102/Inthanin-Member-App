# Inthanin Member App — SQLite Backend

โปรเจกต์นี้ย้ายข้อมูลสมาชิก คะแนน การเช็กอิน การแลกรางวัล ความหวาน และ session จาก `localStorage` ไปยัง **SQLite ผ่าน Python HTTP API** โดยยังใช้หน้าตาเดิม (`index.html`, `css/`, `js/`, `assets/`) ข้อมูลสินค้า/ภาพยังเป็นไฟล์ static เช่นเดิม **ไม่มีตะกร้าในต้นฉบับ** จึงไม่มีระบบคำสั่งซื้อเพิ่ม

## วิธีรัน

ต้องมี Python 3.10+; **ไม่ต้องติดตั้งแพ็กเกจเพิ่ม**

```bash
cd inthanin-sqlite
python server/app.py
```

เปิด `http://127.0.0.1:8000` **ห้ามเปิด `index.html` แบบ `file://`** เพราะต้องใช้ API ที่ Backend ให้บริการ ฐานข้อมูลสร้างอัตโนมัติที่ `server/inthanin.sqlite3` เมื่อรันครั้งแรก

สำหรับ PowerShell: `python .\server\app.py` และเปิด URL เดียวกัน

บัญชีสาธิตเดิม `test@gmail.com` / `12345678` ถูกสร้างเฉพาะเมื่อฐานข้อมูลยังไม่มีสมาชิกดังกล่าว ใช้เพื่อการทดสอบในเครื่องเท่านั้น ตั้ง `SEED_DEMO=0` เพื่อปิดการสร้างบัญชีนี้ตั้งแต่เริ่มต้น (หรือเปลี่ยนรหัสผ่าน/ลบผู้ใช้ในฐานข้อมูลก่อนเผยแพร่)

## ส่วนที่บันทึกใน SQL

- `members`: ชื่อ โทรศัพท์ อีเมล รหัสผ่านที่แฮชด้วย PBKDF2-HMAC-SHA256 คะแนน ค่า sweetness และสถานะเช็กอิน
- `sessions`: เก็บ hash ของ session token; browser ถือ cookie `HttpOnly; SameSite=Strict`
- `checkins`: วันที่และคะแนนที่ได้รับ โดยมี unique constraint ป้องกันเช็กอินซ้ำ
- `redemptions`: ประวัติการแลกรางวัลและคะแนนที่ใช้

API: `/api/register`, `/api/login`, `/api/me`, `/api/logout`, `/api/checkin`, `/api/redeem`, `/api/sweetness`, `/api/welcome`. การหักคะแนนและเพิ่มคะแนนทำบน Backend ภายใน transaction ไม่เชื่อจำนวนคะแนนจาก browser

ฟังก์ชันกดค้างที่สัปดาห์เช็กอินเพื่อจำลองวันถัดไป เปิดได้เฉพาะการทดสอบโดยตั้ง `ENABLE_DEMO_CLOCK=1` ก่อนรันเซิร์ฟเวอร์ ค่าเริ่มต้นปิด ไม่เปิดใน production

## ข้อควรทราบ

- ไม่ย้ายข้อมูล `localStorage` เดิมอัตโนมัติ ข้อมูลสมาชิกที่เคยสร้างใน browser ต้องย้ายด้วยการทำ migration ที่ตรวจสอบเจ้าของบัญชีก่อน
- ใช้ **SQLite** (เป็นฐานข้อมูล SQL แบบไฟล์) เหมาะสำหรับต้นแบบ/ผู้ใช้น้อย หากต้องรองรับหลายเครื่องเซิร์ฟเวอร์พร้อมกัน แนะนำ PostgreSQL + framework รองรับ migration, connection pooling และ HTTPS
- เซิร์ฟเวอร์ Python มาตรฐานนี้จัดเป็น **development server / MVP** เท่านั้น ไม่ควรเปิดใช้งานสาธารณะกับข้อมูลลูกค้าจริงจนกว่าจะมี HTTPS, reverse proxy, rate limiting, CSRF protection ตามการใช้งาน, backup, logging, security review และการจัดการข้อมูลส่วนบุคคล
- รูปภาพสินค้ายังอยู่ `assets/images/` และข้อมูลเมนูอยู่ `js/data/products.js`; ยังไม่ได้ย้ายรายการสินค้าไป SQL เพราะคำขอครั้งนี้มุ่งเปลี่ยน **ข้อมูลที่ใช้ localStorage**
