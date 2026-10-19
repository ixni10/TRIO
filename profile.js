import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";


/* Firebase configuration */

const firebaseConfig = {
    apiKey: "AIzaSyD4pXvEtvQucyjHViD-i0jCzEfe9PKAP0o",
    authDomain: "trio-edu.firebaseapp.com",
    projectId: "trio-edu",
    storageBucket: "trio-edu.firebasestorage.app",
    messagingSenderId: "674708890455",
    appId: "1:674708890455:web:caf174082215dbfe1e5412",
    measurementId: "G-WS0TP8ZFM2"
};

const app = getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* Page elements */

const studentName = document.getElementById("studentName");
const studentEmail = document.getElementById("studentEmail");
const accountCreated = document.getElementById("accountCreated");
const accountStatus = document.getElementById("accountStatus");

const editNameButton = document.getElementById("editNameButton");
const settingsEditName = document.getElementById("settingsEditName");
const changePasswordButton = document.getElementById("changePasswordButton");
const logoutButton = document.getElementById("logoutButton");


/* Hide page until authentication is checked */

document.body.style.display = "none";


/* Edit student name */

async function editStudentName() {
    const user = auth.currentUser;

    if (!user) return;

    const currentName = studentName.textContent;
    const newName = prompt("أدخلي الاسم الجديد:", currentName);

    if (newName === null) return;

    const cleanName = newName.trim();

    if (cleanName.length < 2 || cleanName.length > 60) {
        alert("يجب أن يكون الاسم بين حرفين و60 حرفًا.");
        return;
    }

    try {
        await setDoc(
            doc(db, "users", user.uid),
            {
                displayName: cleanName,
                email: user.email
            },
            { merge: true }
        );

        studentName.textContent = cleanName;

        alert("تم تحديث اسمك بنجاح 💙");

    } catch (error) {
        console.error("Name update error:", error);
        alert("تعذر تحديث الاسم. حاولي مرة أخرى.");
    }
}

editNameButton.addEventListener("click", editStudentName);
settingsEditName.addEventListener("click", editStudentName);


/* Change password */

changePasswordButton.addEventListener("click", async () => {
    const user = auth.currentUser;

    if (!user || !user.email) return;

    try {
        await sendPasswordResetEmail(auth, user.email);

        alert("أرسلنا رابط تغيير كلمة المرور إلى بريدك الإلكتروني.");

    } catch (error) {
        console.error("Password reset error:", error);
        alert("تعذر إرسال رابط تغيير كلمة المرور. حاولي مرة أخرى.");
    }
});


/* Logout */

logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.replace("index.html");
    } catch (error) {
        console.error("Logout error:", error);
        alert("تعذر تسجيل الخروج. حاولي مرة أخرى.");
    }
});


/* Load real account data */

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("index.html");
        return;
    }

    try {
        await user.reload();

        const currentUser = auth.currentUser;

        if (!currentUser || !currentUser.emailVerified) {
            await signOut(auth);
            window.location.replace("index.html");
            return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(userRef);

        let displayName = "";

        if (snapshot.exists()) {
            displayName = snapshot.data().displayName || "";
        }

        if (!displayName.trim()) {
            displayName = prompt(
                "أدخلي الاسم الذي سيظهر في ملفك الشخصي:"
            ) || "";

            displayName = displayName.trim();

            if (displayName.length < 2 || displayName.length > 60) {
                alert("الاسم غير صالح. أعيدي تسجيل الدخول وحاولي مرة أخرى.");
                await signOut(auth);
                window.location.replace("index.html");
                return;
            }

            await setDoc(userRef, {
                displayName,
                email: currentUser.email
            }, { merge: true });
        }

        studentName.textContent = displayName;
        studentEmail.textContent = currentUser.email || "—";

        if (currentUser.metadata.creationTime) {
            accountCreated.textContent = new Date(
                currentUser.metadata.creationTime
            ).toLocaleDateString("ar-SA", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        } else {
            accountCreated.textContent = "—";
        }

        accountStatus.textContent = "نشط";
        document.body.style.display = "";

    } catch (error) {
        console.error("Profile loading error:", error);

        document.body.style.display = "";

        alert(
            "تعذر تحميل بيانات الملف الشخصي. تحققي من اتصال الإنترنت وصلاحيات Firebase."
        );
    }
});