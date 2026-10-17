// Central JSON API client; cookie session is HttpOnly, never exposed to JavaScript.
const API = {
  async call(path, data) {
    const response = await fetch(path, {
      method: data === undefined ? 'GET' : 'POST',
      headers: data === undefined ? {} : {'Content-Type': 'application/json'},
      credentials: 'same-origin',
      body: data === undefined ? undefined : JSON.stringify(data)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    return body;
  }
};
