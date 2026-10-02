/* ═══════════════════════════════════════════
   قرية التلاوة – نجع المهيدات | الموسم الثاني
   script.js — كامل (كود تسلسلي 001-1000 + فيسبوك فقط)
   ═══════════════════════════════════════════ */

/* ═══ 1. Firebase ═══ */
const firebaseConfig = {
  apiKey: "AIzaSyBqslpoSlhCP3196mwHtAFgyjNnQGbAA0Q",
  authDomain: "qaryat-al-tilawa.firebaseapp.com",
  databaseURL: "https://qaryat-al-tilawa-default-rtdb.firebaseio.com/",
  projectId: "qaryat-al-tilawa",
  storageBucket: "qaryat-al-tilawa.firebasestorage.app",
  messagingSenderId: "1087398476457",
  appId: "1:1087398476457:web:e947f3ea497c24536307b8",
  measurementId: "G-SQELMZXN8N"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const counterRef = db.ref("stats/contestantCount");
const contestantsRef = db.ref("contestants");

/* ═══ 2. إعدادات الموقع ═══ */
const CONFIG = {
  whatsapp: "201034911668",
  facebook: "https://www.facebook.com/share/1JpWV2qPVo/?mibextid=wwXIfr",
  phone: "01034911668"
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ═══ 3. Toast ═══ */
let toastTimer = null;
function toast(message, type = "ok") {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("error", type === "error");
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3600);
}

/* ═══ 4. توليد رقم تسلسلي (001-1000) ═══ */
async function generateContestantNumber() {
  const result = await counterRef.transaction(current => {
    const n = (current || 0) + 1;
    if (n > 1000) return current;
    return n;
  });
  if (!result.committed) {
    throw new Error("تعذر توليد رقم المتسابق - العدد وصل للحد الأقصى (1000)");
  }
  const num = result.snapshot.val();
  return String(num).padStart(3, "0");
}

/* ═══ 5. العداد الحقيقي ═══ */
counterRef.on("value", snapshot => {
  const el = $("#counterDisplay");
  if (el) el.textContent = snapshot.val() || 0;
});

/* ═══ 6. توليد QR Code ═══ */
function renderQR(text) {
  const qrBox = $("#qrcode");
  if (!qrBox) return;
  qrBox.innerHTML = "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=2&color=073125&bgcolor=FFFFFF&data=${encodeURIComponent(text || "QT")}`;
  const img = document.createElement("img");
  img.src = qrUrl;
  img.alt = "QR";
  img.crossOrigin = "anonymous";
  qrBox.appendChild(img);
}

/* ═══ 7. ضغط الصورة ═══ */
function compressPhoto(base64, maxSize = 500, quality = 0.7) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; } }
      else { if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

/* ═══ 8. حالة الصورة ═══ */
const photoInput = $("#photo");
const photoPreview = $("#photoPreview");
const state = { photo: "", data: null };

if (photoInput) {
  $("#pickPhotoBtn").addEventListener("click", () => photoInput.click());
  photoPreview.addEventListener("click", () => photoInput.click());
  photoInput.addEventListener("change", () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("الرجاء اختيار ملف صورة صحيح.", "error"); photoInput.value = ""; return; }
    if (file.size > 5 * 1024 * 1024) { toast("حجم الصورة كبير، اختر صورة أقل من 5 ميجابايت.", "error"); photoInput.value = ""; return; }
    const reader = new FileReader();
    reader.onload = ev => {
      state.photo = ev.target.result;
      photoPreview.classList.add("has-img");
      photoPreview.style.backgroundImage = `url(${ev.target.result})`;
      toast("تم اختيار الصورة بنجاح ✅");
    };
    reader.onerror = () => toast("تعذّر قراءة الصورة، حاول مرة أخرى.", "error");
    reader.readAsDataURL(file);
  });
}

/* ═══ 9. نموذج التسجيل ═══ */
const regForm = $("#regForm");
if (regForm) {
  regForm.addEventListener("submit", async e => {
    e.preventDefault();

    const name = $("#fullName").value.trim();
    const age = $("#age").value.trim();
    const level = $("#level").value;
    const center = $("#center").value;
    const phone = $("#phone").value.trim();
    const address = $("#address").value.trim();
    const teacher = $("#teacher").value.trim();
    const amount = $("#amount").value.trim();

    const fail = (msg, el) => {
      toast(msg, "error");
      if (el) { el.focus(); el.scrollIntoView({behavior: "smooth", block: "center"}); }
      return false;
    };

    const nameWords = name.split(/\s+/).filter(w => w.length > 0);
    if (nameWords.length < 4) return fail("اكتب الاسم رباعي (4 أجزاء على الأقل).", $("#fullName"));
    if (!age || Number(age) < 5 || Number(age) > 90) return fail("اكتب سنًا صحيحًا.", $("#age"));
    if (!level) return fail("اختر المستوى.", $("#level"));
    if (!center) return fail("اختر المركز.", $("#center"));
    if (!/^01[0-9]{9}$/.test(phone)) return fail("رقم هاتف غير صحيح (11 رقم يبدأ بـ 01).", $("#phone"));
    if (!teacher) return fail("اكتب اسم المحفّظ.", $("#teacher"));
    if (!amount) return fail("اكتب مقدار الحفظ.", $("#amount"));
    if (!state.photo) return fail("الرجاء اختيار صورة شخصية.", $("#pickPhotoBtn"));

    toast("⏳ جاري التحقق من رقم الهاتف...");
    try {
      const snap = await contestantsRef.orderByChild("phone").equalTo(phone).once("value");
      if (snap.exists()) {
        toast("⚠️ هذا الرقم مسجل بالفعل! لا يمكن التسجيل مرتين.", "error");
        $("#phone").focus();
        return;
      }
    } catch (err) {
      console.error("Duplicate check error:", err);
    }

    toast("⏳ جاري توليد رقم المتسابق...");
    let contestantNumber;
    try {
      contestantNumber = await generateContestantNumber();
    } catch (err) {
      console.error(err);
      toast(err.message || "تعذر توليد رقم المتسابق.", "error");
      return;
    }

    state.data = {
      code: contestantNumber,
      name, age, level, center, phone,
      address: address || "—",
      teacher, amount,
      photo: state.photo
    };
    renderCard(state.data);

    try {
      toast("⏳ جاري حفظ التسجيل...");
      const photoSmall = await compressPhoto(state.photo);
      await contestantsRef.push({
        code: contestantNumber,
        name,
        age: Number(age),
        level, center, phone,
        address: address || "—",
        teacher, amount,
        photo: photoSmall,
        timestamp: new Date().toISOString()
      });
      toast("✅ تم حفظ التسجيل — رقمك: " + contestantNumber);
    } catch (error) {
      console.error(error);
      toast("تعذر الحفظ في قاعدة البيانات.", "error");
    }

    $("#cardEmpty").hidden = true;
    $("#cardWrap").hidden = false;
    setTimeout(() => $("#card").scrollIntoView({behavior: "smooth", block: "start"}), 300);
  });
}

/* ═══ 10. إعادة تعيين ═══ */
const resetBtn = $("#resetBtn");
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    state.photo = ""; state.data = null;
    photoInput.value = "";
    photoPreview.classList.remove("has-img");
    photoPreview.style.backgroundImage = "";
    $("#cardWrap").hidden = true;
    $("#cardEmpty").hidden = false;
  });
}

/* ═══ 11. عرض البطاقة ═══ */
function renderCard(d) {
  $("#cardCode").textContent = d.code;
  $("#cardName").textContent = d.name;
  $("#cardLevel").textContent = d.level;
  $("#cardAge").textContent = d.age + " سنة";
  $("#cardCenter").textContent = d.center;
  $("#cardAddress").textContent = d.address;
  $("#cardTeacher").textContent = d.teacher;
  $("#cardAmount").textContent = d.amount;
  const img = $("#cardPhoto");
  if (img) { img.src = d.photo; img.alt = "صورة المتسابق " + d.name; }
  renderQR("قرية التلاوة - متسابق رقم " + d.code + " - " + d.name);
}

/* ═══ 12. طباعة ═══ */
const printBtn = $("#printBtn");
if (printBtn) {
  printBtn.addEventListener("click", () => {
    if (!state.data) { toast("لا توجد بطاقة لطباعتها.", "error"); return; }
    window.print();
  });
}

/* ═══ 13. مشاركة على واتساب ═══ */
const waBtn = $("#waBtn");
if (waBtn) {
  waBtn.addEventListener("click", async () => {
    if (!state.data) { toast("لا توجد بطاقة لمشاركتها.", "error"); return; }
    const btn = waBtn;
    const oldText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "جاري تحضير الصورة... ⏳";

    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const qrImg = $("#qrcode img");
      if (qrImg && !qrImg.complete) {
        await new Promise(res => { qrImg.onload = res; qrImg.onerror = res; });
      }
      await new Promise(r => setTimeout(r, 700));

      const cardElement = $("#regCard");
      const canvas = await html2canvas(cardElement, {
        scale: 3, useCORS: true, allowTaint: true,
        backgroundColor: "#fef9e6", logging: false
      });
      const imageData = canvas.toDataURL("image/jpeg", 0.92);
      const link = document.createElement("a");
      link.download = `بطاقة_المتسابق_${state.data.code}.jpg`;
      link.href = imageData;
      document.body.appendChild(link);
      link.click();
      link.remove();

      const d = state.data;
      const waText = encodeURIComponent(
`🕌 قرية التلاوة – نجع المهيدات
📖 الموسم الثاني

👤 الاسم: ${d.name}
🎂 السن: ${d.age} سنة
📚 المستوى: ${d.level}
📍 المركز: ${d.center}
📱 الهاتف: ${d.phone}
👨‍🏫 المحفّظ: ${d.teacher}
📖 مقدار الحفظ: ${d.amount}

🔖 رقم المتسابق: ${d.code}

📸 تم تحميل صورة البطاقة — يرجى إرفاقها في المحادثة.`
      );
      setTimeout(() => {
        window.open(`https://wa.me/${CONFIG.whatsapp}?text=${waText}`, "_blank", "noopener");
      }, 700);
      toast("تم تحميل البطاقة وفتح الواتساب ✅");
    } catch (error) {
      console.error(error);
      toast("حدث خطأ أثناء تحضير الصورة.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  });
}

/* ═══ 14. جهات التواصل (فيسبوك فقط) ═══ */
function renderContacts() {
  const grid = $("#contactGrid");
  if (!grid) return;
  const items = [];
  if (CONFIG.facebook) items.push({ icon: "📘", title: "فيسبوك", text: "صفحة المسابقة الرسمية", href: CONFIG.facebook });
  if (!items.length) {
    grid.innerHTML = '<div class="contact-empty">سيتم الإعلان عن وسائل التواصل قريبًا بإذن الله.</div>';
    return;
  }
  grid.innerHTML = items.map(it =>
    `<a class="contact-card" href="${it.href}" target="_blank" rel="noopener"><span class="c-icon">${it.icon}</span><h4>${it.title}</h4><p>${it.text}</p></a>`
  ).join("");
}

/* ═══ 15. تمييز الرابط النشط ═══ */
function initNavHighlight() {
  const links = $$(".nav-link");
  const sections = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (!("IntersectionObserver" in window) || !sections.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = "#" + entry.target.id;
      links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === id));
    });
  }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
  sections.forEach(s => observer.observe(s));
}

/* ═══ 16. التشغيل ═══ */
document.addEventListener("DOMContentLoaded", () => {
  renderContacts();
  initNavHighlight();
});
