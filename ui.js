// Imports initialized Firestore database instance from configuration file[cite: 3]
import { db } from "./firebase-config.js";
// Imports tracked current user object from authentication module[cite: 3]
import { currentUser } from "./auth.js";
// Imports external recipe and video fetching handlers from main script module[cite: 3]
import { fetchExternalRecipes, loadTutorialVideos } from "./script.js";
// Imports Firestore document methods to fetch and update collection data[cite: 3]
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- 1. THEME SWITCHER ENGINE ---
// Listens for initial HTML parsing completion to bind theme switcher logic[cite: 3]
document.addEventListener('DOMContentLoaded', () => {
    // Gets theme toggle button element from DOM[cite: 3]
    const themeToggleBtn = document.querySelector('.theme-toggle-btn');
    
    // 1. Check saved theme preference or default to 'dark'
    // Reads theme preference from browser LocalStorage defaulting to 'dark'[cite: 3]
    const savedTheme = localStorage.getItem('theme') || 'dark';
    // Sets 'data-theme' custom attribute on root HTML element[cite: 3]
    document.documentElement.setAttribute('data-theme', savedTheme);
    // Updates theme toggle button icon to reflect active state[cite: 3]
    updateToggleIcon(savedTheme);

    // 2. Add click event listener to switch themes
    // Binds click listener if toggle button exists[cite: 3]
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            // Reads current active theme attribute[cite: 3]
            const currentTheme = document.documentElement.getAttribute('data-theme');
            // Toggles theme value between 'light' and 'dark'[cite: 3]
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            // Apply new theme to <html> element
            // Sets updated theme attribute on root element[cite: 3]
            document.documentElement.setAttribute('data-theme', newTheme);
            // Save selection to LocalStorage
            // Persists new theme preference string in LocalStorage[cite: 3]
            localStorage.setItem('theme', newTheme);
            // Update button icon
            // Synchronizes icon with new active theme[cite: 3]
            updateToggleIcon(newTheme);
        });
    }

    // Helper function to update the toggle icon
    // Updates button text/emoji according to active theme mode[cite: 3]
    function updateToggleIcon(theme) {
        // Returns early if toggle button is missing from DOM[cite: 3]
        if (!themeToggleBtn) return;
        // Sets emoji based on theme selection[cite: 3]
        themeToggleBtn.innerHTML = theme === 'light' ? '🌙' : '☀️';
        // Sets accessible ARIA label for screen readers[cite: 3]
        themeToggleBtn.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
    }
});

// Updates root element dataset theme and switches font-awesome icon classes[cite: 3]
function applyTheme(theme) {
    // Sets root data attribute[cite: 3]
    document.documentElement.setAttribute("data-theme", theme);
    // Queries theme toggle icon node[cite: 3]
    const themeIcon = document.querySelector("#theme-toggle i");
    
    // Validates element existence before modification[cite: 3]
    if (themeIcon) {
        // Evaluates theme state for styling[cite: 3]
        if (theme === "light") {
            // Applies sun icon for light theme[cite: 3]
            themeIcon.className = "fa-solid fa-sun";
            // Sets icon color[cite: 3]
            themeIcon.style.color = "#f59e0b";
        } else {
            // Applies moon icon for dark theme[cite: 3]
            themeIcon.className = "fa-solid fa-moon";
            // Resets icon color[cite: 3]
            themeIcon.style.color = "inherit";
        }
    }
}

// --- 2. GENERIC & INSTRUCTIONS MODALS ---
// Exports helper function to open general popup modal with injected HTML content[cite: 3]
export function openModal(contentHtml) {
    // Queries modal content inner container node[cite: 3]
    const content = document.getElementById("modal-content");
    // Queries modal overlay parent container node[cite: 3]
    const overlay = document.getElementById("modal-overlay");
    // Checks existence of modal components[cite: 3]
    if (content && overlay) {
        // Injects provided markup string[cite: 3]
        content.innerHTML = contentHtml;
        // Unhides modal popup[cite: 3]
        overlay.classList.remove("hidden");
    }
}

// Exports helper function to hide general popup modal[cite: 3]
export function closeModal() {
    // Queries modal overlay container node[cite: 3]
    const overlay = document.getElementById("modal-overlay");
    // Hides modal overlay node by adding hidden class[cite: 3]
    if (overlay) overlay.classList.add("hidden");
}

// Exports setup function initializing close listeners on standard modal overlays[cite: 3]
export function setupModal() {
    // Gets primary modal close button node[cite: 3]
    const closeBtn = document.getElementById("close-modal-btn");
    // Gets main modal background overlay container[cite: 3]
    const overlay = document.getElementById("modal-overlay");
    // Gets instruction popup close button node[cite: 3]
    const closeInstructionsBtn = document.getElementById("close-instructions-modal");
    // Gets instruction popup overlay container[cite: 3]
    const instructionsModal = document.getElementById("instructions-modal");

    // Attaches click listener to primary close button[cite: 3]
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    // Attaches click listener to primary overlay background[cite: 3]
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            // Closes modal if overlay background directly clicked[cite: 3]
            if (e.target === overlay) closeModal();
        });
    }

    // Checks presence of instructions modal components[cite: 3]
    if (closeInstructionsBtn && instructionsModal) {
        // Binds click listener to hide instructions popup[cite: 3]
        closeInstructionsBtn.addEventListener("click", () => instructionsModal.classList.add("hidden"));
        // Binds click listener on backdrop to hide instructions popup[cite: 3]
        instructionsModal.addEventListener("click", (e) => {
            if (e.target === instructionsModal) instructionsModal.classList.add("hidden");
        });
    }
}

// --- 3. EDIT RECIPE MODAL & ALL RECIPE FIELDS FIRESTORE FIX ---
// Sets up edit recipe modal dialog event handling[cite: 3]
export function setupEditRecipeModal() {
    // Gets edit modal wrapper node[cite: 3]
    const editModal = document.getElementById("edit-recipe-modal");
    // Gets edit modal close button node[cite: 3]
    const closeBtn = document.getElementById("close-edit-modal");
    // Gets edit form node[cite: 3]
    const form = document.getElementById("edit-recipe-form");

    // Attaches listeners for closing modal[cite: 3]
    if (closeBtn && editModal) {
        closeBtn.addEventListener("click", () => editModal.classList.add("hidden"));
        editModal.addEventListener("click", (e) => {
            if (e.target === editModal) editModal.classList.add("hidden");
        });
    }

    // Attaches submit listener to update form[cite: 3]
    if (form) {
        form.addEventListener("submit", async (e) => {
            // Prevents full page refresh on submit event[cite: 3]
            e.preventDefault();
            // Calls handler saving changes back to Firestore[cite: 3]
            await saveRecipeChanges();
        });
    }
}

// Opens the edit modal and populates ALL recipe fields
// Asynchronously loads data for a single recipe and fills edit form inputs[cite: 3]
export async function openEditRecipeModal(recipeId) {
    // Retrieves edit modal container element[cite: 3]
    const modal = document.getElementById("edit-recipe-modal");
    // Exits early if target modal node is not present[cite: 3]
    if (!modal) return;

    // Wraps database fetch call in try block[cite: 3]
    try {
        // Creates document reference for recipe record in Firestore[cite: 3]
        const docRef = doc(db, "recipes", recipeId);
        // Fetches document snapshot from database[cite: 3]
        const snapshot = await getDoc(docRef);

        // Verifies document snapshot exists[cite: 3]
        if (!snapshot.exists()) {
            alert("Không tìm thấy dữ liệu công thức.");
            return;
        }

        // Extracts document data[cite: 3]
        const data = snapshot.data();

        // Populate form inputs for all fields
        // Assigns recipe ID to hidden form field[cite: 3]
        document.getElementById("edit-recipe-id").value = recipeId;
        // Assigns title to form input[cite: 3]
        document.getElementById("edit-recipe-title").value = data.title || data.strMeal || "";
        // Assigns category to form input[cite: 3]
        document.getElementById("edit-recipe-category").value = data.category || data.strCategory || "";
        // Assigns area to form input[cite: 3]
        document.getElementById("edit-recipe-area").value = data.area || data.strArea || "";
        // Assigns cook time to form input[cite: 3]
        document.getElementById("edit-recipe-cooktime").value = data.cookTime || "";
        // Assigns image URL to form input[cite: 3]
        document.getElementById("edit-recipe-image").value = data.image || data.strMealThumb || "";
        
        // Handle ingredients formatting (array to newline string)
        // Converts array of ingredients to newline-separated string[cite: 3]
        const ingredientsText = Array.isArray(data.ingredients) 
            ? data.ingredients.join("\n") 
            : (data.ingredients || "");
        // Sets ingredients text string into textarea[cite: 3]
        document.getElementById("edit-recipe-ingredients").value = ingredientsText;

        // Assigns cooking instructions string into textarea[cite: 3]
        document.getElementById("edit-recipe-instructions").value = data.instructions || data.strInstructions || "";

        // Unhides modal popup UI[cite: 3]
        modal.classList.remove("hidden");
    // Catches network/database retrieval errors[cite: 3]
    } catch (err) {
        console.error("Lỗi khi tải thông tin công thức:", err);
        alert("Không thể tải thông tin công thức.");
    }
}

// Saves ALL fields back to Firestore
// Asynchronously updates modified recipe fields back to Cloud Firestore[cite: 3]
async function saveRecipeChanges() {
    // Reads hidden document ID input[cite: 3]
    const id = document.getElementById("edit-recipe-id").value;
    // Reads title input string[cite: 3]
    const title = document.getElementById("edit-recipe-title").value.trim();
    // Reads category input string[cite: 3]
    const category = document.getElementById("edit-recipe-category").value.trim();
    // Reads area input string[cite: 3]
    const area = document.getElementById("edit-recipe-area").value.trim();
    // Reads cook time input string[cite: 3]
    const cookTime = document.getElementById("edit-recipe-cooktime").value.trim();
    // Reads image path input string[cite: 3]
    const image = document.getElementById("edit-recipe-image").value.trim();
    
    // Parse newline-separated string into an array
    // Reads ingredients text content[cite: 3]
    const ingredientsRaw = document.getElementById("edit-recipe-ingredients").value;
    // Splits text content by newlines into array of items[cite: 3]
    const ingredients = ingredientsRaw.split("\n").map(i => i.trim()).filter(i => i.length > 0);

    // Reads instructions text content[cite: 3]
    const instructions = document.getElementById("edit-recipe-instructions").value.trim();

    // Wraps update operation in try block[cite: 3]
    try {
        // Creates Firestore document reference matching ID[cite: 3]
        const docRef = doc(db, "recipes", id);
        // Persists updated fields in database document[cite: 3]
        await updateDoc(docRef, {
            title,
            category,
            area,
            cookTime,
            image,
            ingredients,
            instructions,
            updatedAt: new Date()
        });

        // Displays completion alert message[cite: 3]
        alert("Cập nhật công thức thành công!");
        // Hides edit modal wrapper[cite: 3]
        document.getElementById("edit-recipe-modal").classList.add("hidden");
        
        // Triggers custom load function if defined globally on window object[cite: 3]
        if (typeof window.loadUserRecipes === "function") {
            window.loadUserRecipes();
        }
    // Catches database write errors[cite: 3]
    } catch (err) {
        console.error("Lỗi cập nhật Firestore:", err);
        alert("Có lỗi xảy ra khi lưu công thức.");
    }
}

// --- 4. NAVIGATION & CLOUDINARY AVATAR TRIGGER ---
// Sets up single-page application section navigation[cite: 3]
export function setupNavigation() {
    // Queries view-switching navigation buttons[cite: 3]
    const navButtons = document.querySelectorAll(".nav-btn[data-view]");
    // Queries page view section elements[cite: 3]
    const views = document.querySelectorAll(".view-section");

    // Binds click handlers to each navigation button[cite: 3]
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            // Reads target view element ID string[cite: 3]
            const targetView = btn.getAttribute("data-view");

            // Removes active class from all nav buttons[cite: 3]
            navButtons.forEach(b => b.classList.remove("active"));
            // Removes active class from all view sections[cite: 3]
            views.forEach(v => v.classList.remove("active"));

            // Highlights current clicked button[cite: 3]
            btn.classList.add("active");
            // Retrieves target section element by ID[cite: 3]
            const targetElem = document.getElementById(targetView);
            // Reveals target view section[cite: 3]
            if (targetElem) targetElem.classList.add("active");
        });
    });

    // Retrieves change avatar button node[cite: 3]
    const changeAvatarBtn = document.getElementById("change-avatar-btn");
    // Configures click listener launching upload widget[cite: 3]
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener("click", (e) => {
            // Prevents default link routing behavior[cite: 3]
            e.preventDefault();
            // Opens Cloudinary image uploader[cite: 3]
            openCloudinaryWidget();
        });
    }
}

// --- 5. SEARCH ENGINE IMPLEMENTATION ---
// Configures real-time and button search handlers[cite: 3]
export function setupSearch() {
    // Queries search button element node[cite: 3]
    const searchBtn = document.getElementById("search-btn");
    // Queries search input field node[cite: 3]
    const searchInput = document.getElementById("global-search");

    // Exits setup if elements are missing[cite: 3]
    if (!searchBtn || !searchInput) return;

    // Defines search execution routine[cite: 3]
    const performSearch = () => {
        // Reads trimmed input query string[cite: 3]
        const term = searchInput.value.trim();
        // Executes queries if non-empty[cite: 3]
        if (term) {
            fetchExternalRecipes(term);
            loadTutorialVideos(term);
        // Resets display grids to defaults if query is empty[cite: 3]
        } else {
            fetchExternalRecipes("All");
            loadTutorialVideos("All");
        }
    };

    // Binds search function to search button click[cite: 3]
    searchBtn.addEventListener("click", performSearch);
    // Binds search function to 'Enter' key press within input element[cite: 3]
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") performSearch();
    });
}

// --- 6. CLOUDINARY AVATAR UPLOAD WIDGET ---
// Configures and opens Cloudinary upload widget specifically for profile pictures[cite: 3]
export function openCloudinaryWidget() {
    // Restricts avatar updates to authenticated users[cite: 3]
    if (!currentUser) {
        alert("Vui lòng đăng nhập để đổi ảnh đại diện.");
        return;
    }

    // Ensures Cloudinary script dependency is available[cite: 3]
    if (typeof window.cloudinary === "undefined") {
        alert("Thư viện Cloudinary chưa sẵn sàng. Vui lòng kiểm tra kết nối mạng.");
        return;
    }

    // Calls Cloudinary SDK method opening media upload widget[cite: 3]
    window.cloudinary.openUploadWidget({
        cloudName: "jfymknrw",
        uploadPreset: "ml_default",
        sources: ['local', 'url', 'camera'],
        multiple: false,
        cropping: true,
        clientAllowedFormats: ["png", "jpg", "jpeg", "webp", "gif"],
        resourceType: "image"
    // Asynchronous upload event callback handling[cite: 3]
    }, async (error, result) => {
        // Verifies successful asset upload event[cite: 3]
        if (!error && result && result.event === "success") {
            // Retrieves public URL for uploaded file[cite: 3]
            const imageUrl = result.info.secure_url;
            
            // Gets avatar image node in profile view[cite: 3]
            const profileAvatar = document.getElementById("profile-avatar");
            // Updates avatar image source element[cite: 3]
            if (profileAvatar) {
                profileAvatar.src = imageUrl;
            }

            // Updates photoURL field inside user Firestore document[cite: 3]
            try {
                await updateDoc(doc(db, "users", currentUser.uid), { photoURL: imageUrl });
                alert("Đã cập nhật ảnh đại diện thành công!");
            // Catches database sync errors[cite: 3]
            } catch (err) {
                console.error("Lỗi cập nhật Firestore:", err);
                alert("Đã tải ảnh lên nhưng không thể lưu vào tài khoản.");
            }
        }
    });
}

// Binds click listener ensuring explore navigation button redirects correctly[cite: 3]
document.addEventListener('DOMContentLoaded', () => {
    // Locates explore button node[cite: 3]
    const exploreBtn = document.getElementById('explore-btn');
    // Checks button existence[cite: 3]
    if (exploreBtn) {
        // Binds explicit navigation handler[cite: 3]
        exploreBtn.addEventListener('click', (e) => {
            // Ensure navigation happens regardless of global preventDefault rules
            // Redirects window location to target anchor href[cite: 3]
            window.location.href = exploreBtn.getAttribute('href');
        });
    }
});