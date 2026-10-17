let on = false;
const box = $("#box");
function setChk(v) {
  on = v;
  box.classList.toggle("on", on);
  box.setAttribute("aria-checked", on);
  $("#submit").disabled = !on;
}
box.onclick = () => setChk(!on);
box.onkeydown = (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    setChk(!on);
  }
};
function eye(btn, inp) {
  btn.onclick = () => {
    const h = inp.type === "password";
    inp.type = h ? "text" : "password";
    btn.textContent = h ? "visibility" : "visibility_off";
  };
}
eye($("#eye"), $("#pw"));
eye($("#leye"), $("#lpw"));
$("#tcLink").onclick = () => {
  $("#tcBody").scrollTop = 0;
  $("#terms").classList.add("open");
};
$("#tcEn").onclick = $("#tcLink").onclick;
$("#tcBack").onclick = () => $("#terms").classList.remove("open");
$("#accept").onclick = () => {
  setChk(true);
  $("#terms").classList.remove("open");
};
$("#toLogin").onclick = () => $("#login").classList.add("open");
$("#toRegis").onclick = (e) => {
  e.preventDefault();
  $("#login").classList.remove("open");
};
function toast(m) {
  const t = $("#toast");
  t.textContent = m;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}
let mem = []; // Members are stored only in SQL; this remains for compatibility with existing UI names.
$("#submit").onclick = async () => {
  const v = ["#name", "#phone_in", "#email", "#pw"].map((s) =>
      $(s).value.trim(),
    ),
    e = $("#err");
  if (v.some((x) => !x)) {
    e.textContent = L().errEmpty;
    return;
  }
  if (v[3].length < DB.minPw) {
    e.textContent = L().errPw;
    return;
  }
  e.textContent = "";
  try {
    await API.call("/api/register", {
      name: v[0],
      phone: v[1],
      email: v[2],
      password: v[3],
    });
    load(() => {
      toast(L().ok);
      $("#login").classList.add("open");
    });
  } catch (err) {
    e.textContent = err.message;
  }
};
$("#loginBtn").onclick = async () => {
  const em = $("#lemail").value.trim().toLowerCase(),
    pw = $("#lpw").value,
    e = $("#lerr");
  if (!em || !pw) {
    e.textContent = L().errEmpty;
    return;
  }
  try {
    const m = await API.call("/api/login", { email: em, password: pw });
    e.textContent = "";
    load(() => {
      resetUI();
      renderHome(m);
      $("#home").classList.add("open");
    });
  } catch (err) {
    e.textContent = err.message;
  }
};
