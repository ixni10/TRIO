// ========================================
// TRIO — Firebase Authentication
// ========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

// ========================================
// إعدادات Firebase
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyD4pXvEtvQucyjHViD-i0jCzEfe9PKAP0o",
    authDomain: "trio-edu.firebaseapp.com",
    projectId: "trio-edu",
    storageBucket: "trio-edu.firebasestorage.app",
    messagingSenderId: "674708890455",
    appId: "1:674708890455:web:caf174082215dbfe1e5412",
    measurementId: "G-WS0TP8ZFM2"
};


// تشغيل Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ========================================
// إظهار وإخفاء كلمات المرور
// ========================================

document.querySelectorAll("[data-password-target]").forEach((button) => {

    button.addEventListener("click", () => {

        const inputId = button.dataset.passwordTarget;
        const passwordInput = document.getElementById(inputId);

        if (!passwordInput) {
            return;
        }

        const isHidden = passwordInput.type === "password";

        passwordInput.type = isHidden ? "text" : "password";

        button.setAttribute("aria-pressed", String(isHidden));

        button.setAttribute(
            "aria-label",
            isHidden ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
        );

    });

});


// ========================================
// إنشاء حساب جديد
// ========================================

const registerForm = document.getElementById("register-form");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const emailInput = document.getElementById("register-email");
        const passwordInput = document.getElementById("register-password");
        const confirmPasswordInput = document.getElementById("confirm-password");
        const message = document.getElementById("register-message");
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const buttonText = submitButton.querySelector("span");

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
       
       // قراءة اسم الطالبة
        const nameInput = document.getElementById("register-name");
const displayName = nameInput.value.trim();

        message.textContent = "";
        message.style.color = "";

        if (password !== confirmPassword) {
            message.textContent = "كلمتا المرور غير متطابقتين.";
            message.style.color = "#C0394A";
            confirmPasswordInput.focus();
            return;
        }

        if (password.length < 8) {
            message.textContent = "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.";
            message.style.color = "#C0394A";
            passwordInput.focus();
            return;
        }

        if (displayName.length < 2 || displayName.length > 60) {
    message.textContent = "الاسم يجب أن يكون بين حرفين و60 حرفًا.";
    message.style.color = "#C0394A";
    nameInput.focus();
    return;
}

        submitButton.disabled = true;
        buttonText.textContent = "جارٍ إنشاء الحساب...";

        try {
           const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
);

const user = userCredential.user;

// حفظ اسم الطالبة وبريدها في Firestore
try {
    await setDoc(doc(db, "users", user.uid), {
        displayName: displayName,
        email: user.email
    });
} catch (saveError) {
    console.error("Profile save error:", saveError);

    message.textContent =
        "تم إنشاء الحساب، لكن تعذر حفظ الاسم. يرجى التواصل مع الإدارة.";

    message.style.color = "#C0394A";
    return;
}

// إرسال رسالة التحقق من البريد الإلكتروني
try {
    await sendEmailVerification(user);

    message.textContent =
        "تم إنشاء حسابك بنجاح! تحققي من بريدك الإلكتروني لتأكيد الحساب.";
} catch (verificationError) {
    console.error("Email verification error:", verificationError);

    message.textContent =
        "تم إنشاء حسابك، لكن تعذر إرسال رسالة التحقق. يمكنك طلبها لاحقًا.";
}

message.style.color = "#287A52";
registerForm.reset();

        } catch (error) {
            console.error("Registration error:", error);

            const errorMessages = {
                "auth/email-already-in-use":
                    "هذا البريد الإلكتروني مسجل مسبقًا. جرّبي تسجيل الدخول.",
                "auth/invalid-email":
                    "البريد الإلكتروني غير صحيح.",
                "auth/weak-password":
                    "كلمة المرور ضعيفة. اختاري كلمة مرور أقوى.",
                "auth/network-request-failed":
                    "تعذر الاتصال بالإنترنت. حاولي مجددًا.",
                "auth/too-many-requests":
                    "حدثت محاولات كثيرة. انتظري قليلًا ثم حاولي مجددًا.",
                "auth/operation-not-allowed":
                    "إنشاء الحسابات غير مفعّل في إعدادات Firebase.",
                "auth/invalid-api-key":
                    "تعذر الاتصال بـ Firebase. تحققي من إعدادات المشروع."
            };

            message.textContent =
                errorMessages[error.code] ||
                `تعذر إنشاء الحساب (${error.code || "خطأ غير معروف"}). راجعي Console للتفاصيل.`;

            message.style.color = "#C0394A";

        } finally {
            submitButton.disabled = false;
            buttonText.textContent = "إنشاء الحساب";
        }
    });
}
// ========================================
// تسجيل الدخول والتحقق من البريد الإلكتروني
// ========================================

const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const message = document.getElementById("login-message");
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const buttonText = submitButton.querySelector("span");

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        submitButton.disabled = true;
        buttonText.textContent = "جارٍ تسجيل الدخول...";
        message.textContent = "";

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            // منع الدخول إذا لم يتم التحقق من البريد الإلكتروني
            if (!user.emailVerified) {
                await auth.signOut();

                message.textContent =
                    "تحققي من بريدك الإلكتروني أولًا، ثم حاولي تسجيل الدخول.";

                message.style.color = "#C0394A";
                return;
            }

           message.textContent = "تم التحقق من حسابك بنجاح!";
message.style.color = "#287A52";

submitButton.disabled = true;

setTimeout(() => {
    window.location.assign("./dashboard.html");
}, 500);
        } catch (error) {
            console.error("Login error:", error);

            const errorMessages = {
                "auth/invalid-credential":
                    "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
                "auth/user-not-found":
                    "لا يوجد حساب بهذا البريد الإلكتروني.",
                "auth/wrong-password":
                    "كلمة المرور غير صحيحة.",
                "auth/invalid-email":
                    "البريد الإلكتروني غير صحيح.",
                "auth/too-many-requests":
                    "محاولات كثيرة. انتظري قليلًا ثم حاولي مجددًا.",
                "auth/network-request-failed":
                    "تحققي من اتصالك بالإنترنت."
            };

            message.textContent =
                errorMessages[error.code] ||
                "تعذر تسجيل الدخول. حاولي مرة أخرى.";

            message.style.color = "#C0394A";
        } finally {
            submitButton.disabled = false;
            buttonText.textContent = "تسجيل الدخول";
        }
    });
}

// إظهار وإخفاء كلمة المرور
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");
const passwordIcon = document.getElementById("password-icon");

if (passwordInput && togglePassword) {
    togglePassword.addEventListener("click", () => {
        const isHidden = passwordInput.type === "password";

        passwordInput.type = isHidden ? "text" : "password";

        togglePassword.setAttribute(
            "aria-label",
            isHidden ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
        );

        togglePassword.setAttribute("aria-pressed", String(isHidden));

        if (passwordIcon) {
            passwordIcon.textContent = isHidden ? "◎" : "◉";
        }
    });
}






