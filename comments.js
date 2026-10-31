/* =========================================
   TRIO COMMENTS SYSTEM
========================================= */

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    limit,
    getDocs,
    getCountFromServer,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";


/* =========================================
   FIREBASE CONFIG
========================================= */

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
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_UIDS = [
    "XiSdl0epfJVB509KuKCs0pK8XcK2",
    "MjRTDex0KFU2vFdqzVYLYSLPOYe2"
];
const commentsRef = collection(db, "comments");


/* =========================================
   DOM ELEMENTS
========================================= */

const list = document.getElementById("commentsList");
const countElement = document.getElementById("commentsCount");

const openButton = document.getElementById("openCommentModal");
const modal = document.getElementById("commentModal");
const closeButton = document.getElementById("closeCommentModal");

const form = document.getElementById("commentForm");

const nameInput = document.getElementById("commentName");
const roleInput = document.getElementById("commentRole");
const customRoleInput = document.getElementById("commentCustomRole");
const textInput = document.getElementById("commentText");

const customRoleGroup = document.getElementById("customRoleGroup");
const statusElement = document.getElementById("commentStatus");

const showAllButton = document.getElementById("showAllComments");


/* =========================================
   STATE
========================================= */

let currentUser = null;
let showingAll = false;
let loading = false;


/* =========================================
   MODAL FUNCTIONS
========================================= */

function openModal() {
    if (!modal) return;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    if (!modal) return;

    modal.classList.remove("active");
    document.body.style.overflow = "";

    form?.reset();

    if (customRoleGroup) {
        customRoleGroup.hidden = true;
    }

    if (statusElement) {
        statusElement.textContent = "";
        statusElement.classList.remove("error");
    }
}

openButton?.addEventListener("click", openModal);

closeButton?.addEventListener("click", closeModal);

modal?.addEventListener("click", event => {
    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        modal?.classList.contains("active")
    ) {
        closeModal();
    }
});


/* =========================================
   CUSTOM ROLE
========================================= */

roleInput?.addEventListener("change", () => {
    const isOther = roleInput.value === "أخرى";

    if (customRoleGroup) {
        customRoleGroup.hidden = !isOther;
    }

    if (!isOther && customRoleInput) {
        customRoleInput.value = "";
    }
});


/* =========================================
   DATE FORMAT
========================================= */

function formatDate(timestamp) {
    if (!timestamp?.toDate) {
        return "الآن";
    }

    return new Intl.DateTimeFormat("ar-SA", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(timestamp.toDate());
}


/* =========================================
   AVATAR
========================================= */

function createAvatar() {
    const avatar = document.createElement("div");

    avatar.className = "comment-avatar";
    avatar.setAttribute("aria-hidden", "true");

    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");

    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    const head = document.createElementNS(svgNS, "circle");

    head.setAttribute("cx", "12");
    head.setAttribute("cy", "8");
    head.setAttribute("r", "3.5");

    const body = document.createElementNS(svgNS, "path");

    body.setAttribute("d", "M5 21c0-4 3-7 7-7s7 3 7 7");

    svg.append(head, body);
    avatar.appendChild(svg);

    return avatar;
}


/* =========================================
   RENDER COMMENT
========================================= */

function renderComment(comment, id) {
    const card = document.createElement("article");

    card.className = "comment-card";

    // Header

    const header = document.createElement("div");

    header.className = "comment-header";

    // Author

    const author = document.createElement("div");

    author.className = "comment-author-info";

    // Avatar

    const avatar = createAvatar();

    // Author details

    const authorDetails = document.createElement("div");

    authorDetails.className = "comment-author-details";

    // Name

    const authorName = document.createElement("span");

    authorName.className = "comment-author";

    authorName.textContent = comment.name?.trim() || "زائر";

    // Role

    const role = document.createElement("span");

    role.className = "comment-role";

    role.textContent = comment.role === "أخرى"
        ? (comment.customRole || "أخرى")
        : comment.role;

    authorDetails.append(authorName, role);

    author.append(avatar, authorDetails);

    // Date

    const date = document.createElement("time");

    date.className = "comment-date";

    date.textContent = formatDate(comment.createdAt);

    header.append(author, date);

    // Comment text

    const content = document.createElement("p");

    content.className = "comment-text";

    content.textContent = comment.text || "";

    card.append(header, content);

    // Admin delete

if (ADMIN_UIDS.includes(currentUser?.uid)) {
            const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "comment-delete";
        deleteButton.textContent = "حذف التعليق";

        deleteButton.addEventListener("click", async () => {
            if (!confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
                return;
            }

            try {
                await deleteDoc(doc(db, "comments", id));

                await loadComments();

            } catch (error) {
                console.error("Delete error:", error);

                alert("تعذر حذف التعليق.");
            }
        });

        card.appendChild(deleteButton);
    }

    return card;
}


/* =========================================
   LOAD COMMENTS
========================================= */

async function loadComments() {
    if (!list || loading) return;

    loading = true;

    list.replaceChildren();

    try {
        // Count

        const countSnapshot = await getCountFromServer(commentsRef);

        const total = countSnapshot.data().count;

        if (countElement) {
            countElement.textContent = `إجمالي التعليقات: ${total}`;
        }

        // Query

        const commentsQuery = showingAll
            ? query(
                commentsRef,
                orderBy("createdAt", "desc")
            )
            : query(
                commentsRef,
                orderBy("createdAt", "desc"),
                limit(3)
            );

        const snapshot = await getDocs(commentsQuery);

        // Empty state

        if (snapshot.empty) {
            const empty = document.createElement("p");

            empty.className = "comments-empty";

            empty.textContent =
                "لا توجد تعليقات حتى الآن. كن أول من يشارك رأيه!";

            list.appendChild(empty);

        } else {
            snapshot.forEach(item => {
                const commentCard = renderComment(
                    item.data(),
                    item.id
                );

                list.appendChild(commentCard);
            });
        }

        // Show all button

        if (showAllButton) {
            showAllButton.hidden = total <= 3;

            showAllButton.textContent = showingAll
                ? "عرض أحدث 3 تعليقات"
                : "إظهار جميع التعليقات";
        }

    } catch (error) {
        console.error("Comments loading error:", error);

        list.replaceChildren();

        const errorMessage = document.createElement("p");

        errorMessage.className = "comments-empty";

        errorMessage.textContent =
            "تعذر تحميل التعليقات. تحقق من الاتصال بالإنترنت.";

        list.appendChild(errorMessage);

    } finally {
        loading = false;
    }
}


/* =========================================
   SHOW ALL COMMENTS
========================================= */

showAllButton?.addEventListener("click", async () => {
    showingAll = !showingAll;

    await loadComments();
});


/* =========================================
   PUBLISH COMMENT
========================================= */

form?.addEventListener("submit", async event => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const role = roleInput.value;
    const customRole = customRoleInput.value.trim();
    const text = textInput.value.trim();

    // Validation

    if (!role) {
        statusElement.textContent =
            "يرجى اختيار نوع المستخدم.";

        statusElement.classList.add("error");

        return;
    }

    if (role === "أخرى" && !customRole) {
        statusElement.textContent =
            "يرجى كتابة الوصف.";

        statusElement.classList.add("error");

        return;
    }

    if (!text || text.length > 500) {
        statusElement.textContent =
            "التعليق يجب ألا يتجاوز 500 حرف.";

        statusElement.classList.add("error");

        return;
    }

    const publishButton = form.querySelector('[type="submit"]');

    publishButton.disabled = true;

    statusElement.textContent = "جارٍ نشر التعليق...";

    statusElement.classList.remove("error");

    try {
        await addDoc(commentsRef, {
            name,
            role,

            customRole: role === "أخرى"
                ? customRole
                : "",

            text,

            createdAt: serverTimestamp()
        });

        showingAll = false;

        closeModal();

        await loadComments();

    } catch (error) {
        console.error("Comment publishing error:", error);

        statusElement.textContent =
            "تعذر نشر التعليق. يرجى المحاولة مرة أخرى.";

        statusElement.classList.add("error");

    } finally {
        publishButton.disabled = false;
    }
});


/* =========================================
   AUTH STATE
========================================= */

onAuthStateChanged(auth, user => {
    currentUser = user;

    loadComments();
});