const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp();

// نستخدم هذه الوظيفة لاحقًا لتجهيز صلاحية المالك بطريقة آمنة.
exports.checkOwnerSetup = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "يجب تسجيل الدخول أولًا."
        );
    }

    const user = await getAuth().getUser(request.auth.uid);

    return {
        uid: user.uid,
        email: user.email || null,
        message: "تم الاتصال بالخدمة الإدارية بنجاح."
    };
});