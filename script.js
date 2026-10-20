// Imports the initialized Cloud Firestore instance from the local Firebase config file[cite: 2]
import { db } from "./firebase-config.js";
// Imports the exported variable holding the currently logged-in user state[cite: 2]
import { currentUser } from "./auth.js";
// Imports user interface control functions (modals, search, navigation) from ui.js[cite: 2]
import { openModal, closeModal, setupNavigation, setupSearch, setupModal } from "./ui.js";
// Imports CRUD and querying utility methods from the Firestore SDK via CDN[cite: 2]
import { 
    collection, addDoc, updateDoc, deleteDoc, getDocs, doc, query, where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Declares and exports an array to hold the current user's saved recipes in memory[cite: 2]
export let userSavedRecipes = [];
// Attaches an empty array to the global window object to cache external API-fetched recipes[cite: 2]
window.currentFetchedMeals = [];

// 1. CREATE RECIPE CARD WITH EXPLICIT DATASETS
// Declares and exports a function to build DOM card elements, with a parameter toggling user collection features[cite: 2]
export function createRecipeCard(recipe, isUserCollection = false) {
    // Creates a new <div> container element for the recipe card[cite: 2]
    const card = document.createElement("div");
    // Assigns the CSS class 'card' to the newly created element[cite: 2]
    card.className = "card";
    // Sets a custom HTML data attribute 'data-id' containing the recipe's unique ID[cite: 2]
    card.setAttribute("data-id", recipe.id);
    // Stores recipe instructions on a data attribute, falling back to a default message[cite: 2]
    card.dataset.instructions = recipe.instructions || "No instructions available.";
    // Stores recipe title on a data attribute, falling back to a default title[cite: 2]
    card.dataset.title = recipe.title || "Recipe Instructions";

    // Determines the image URL using fallback logic down to a standard placeholder[cite: 2]
    const imgUrl = recipe.image || recipe.imageUrl || "https://via.placeholder.com/300";

    // Injects the internal HTML markup into the card element dynamically[cite: 2]
    card.innerHTML = `
        <img src="${imgUrl}" alt="${recipe.title}">
        <div class="card-body">
            <h3 class="card-title">${recipe.title}</h3>
            <br>
            <span class="category-tag">${recipe.category || "General"}</span>
            
            <div class="card-actions">
                ${isUserCollection 
                    ? `
                        <div class="card-actions-top">
                            <button type="button" class="btn btn-outline btn-instructions" data-id="${recipe.id}">
                                Instructions
                            </button>
                            <button type="button" class="btn btn-primary btn-edit" data-id="${recipe.id}">
                                Change
                            </button>
                        </div>
                        <button type="button" class="btn btn-delete btn-delete-recipe" data-id="${recipe.id}">
                            Delete
                        </button>
                      `
                    : `
                        <div class="card-actions-top">
                            <button type="button" class="btn btn-outline btn-instructions" data-id="${recipe.id}">
                                Instructions
                            </button>
                            <button type="button" class="btn btn-primary save-recipe-btn" data-id="${recipe.id}">
                                Save
                            </button>
                        </div>
                      `
                }
            </div>
        </div>
    `;

    // Returns the fully constructed HTML element node[cite: 2]
    return card;
}

// 2. GLOBAL ACTION HANDLERS
// Assigns a recipe deletion confirmation handler function to the window object[cite: 2]
window.handleDeleteSavedRecipe = function(recipeId) {
    // Exits early if no recipe ID was passed into the handler[cite: 2]
    if (!recipeId) return;

    // 1. Locate recipe details to display inside the modal
    // Converts the recipe ID parameter to a string type for consistent matching[cite: 2]
    const targetId = String(recipeId);
    // Finds the corresponding recipe object within the saved recipes memory array[cite: 2]
    let recipe = userSavedRecipes.find(r => String(r.id) === targetId);

    // Checks if the recipe was not found in memory[cite: 2]
    if (!recipe) {
        // Attempts to locate the recipe's DOM element on the web page[cite: 2]
        const cardElem = document.querySelector(`.card[data-id="${targetId}"]`);
        // Constructs a temporary object holding title information extracted from DOM elements[cite: 2]
        recipe = {
            title: cardElem?.dataset?.title || cardElem?.querySelector(".card-title")?.innerText || "món ăn này"
        };
    }

    // Resolves the final title to show in the UI modal[cite: 2]
    const recipeTitle = recipe?.title || "món ăn này";

    // 2. Open confirmation modal with clear, professional layout
    // Opens a popup modal containing confirmation UI HTML[cite: 2]
    openModal(`
        <div style="text-align: center; padding: 10px 5px;">
            <div style="font-size: 2.5rem; color: #e74c3c; margin-bottom: 10px;">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-color, white); margin-bottom: 8px;">
                Xác Nhận Xóa Công Thức
            </h3>
            <p style="color: #666; font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">
                Bạn có chắc chắn muốn xóa công thức <strong style="color: red;">"${recipeTitle}"</strong> khỏi bộ sưu tập? Hành động này không thể hoàn tác.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button type="button" id="cancel-delete-btn" class="btn btn-outline" style="min-width: 110px;">
                    Hủy bỏ
                </button>
                <button type="button" id="confirm-delete-btn" class="btn" style="background-color: #e74c3c; color: #fff; border: none; min-width: 110px;">
                    Xóa công thức
                </button>
            </div>
        </div>
    `);

    // 3. Attach actions for Cancel and Confirm buttons
    // Adds a click listener to the cancel button to dismiss the modal[cite: 2]
    document.getElementById("cancel-delete-btn")?.addEventListener("click", () => {
        // Invokes modal closing routine[cite: 2]
        closeModal();
    });

    // Adds an asynchronous click listener to the confirm deletion button[cite: 2]
    document.getElementById("confirm-delete-btn")?.addEventListener("click", async () => {
        // Starts a try block to gracefully process deletion asynchronous operations[cite: 2]
        try {
            // Delete record from Firestore
            // Executes Firestore API call to remove document from 'recipes' collection by ID[cite: 2]
            await deleteDoc(doc(db, "recipes", targetId));

            // Sync local state
            // Removes the deleted item from the local array in memory[cite: 2]
            userSavedRecipes = userSavedRecipes.filter(r => String(r.id) !== targetId);

            // Parses saved recipes stored in browser LocalStorage[cite: 2]
            let savedRecipes = JSON.parse(localStorage.getItem("recipes")) || [];
            // Filters out the deleted recipe item[cite: 2]
            savedRecipes = savedRecipes.filter(r => String(r.id) !== targetId);
            // Updates updated array back to LocalStorage[cite: 2]
            localStorage.setItem("recipes", JSON.stringify(savedRecipes));

            // Remove card from UI
            // Queries DOM for the matching card element[cite: 2]
            const cardElement = document.querySelector(`.card[data-id="${targetId}"]`);
            // Removes card element from HTML layout if it exists[cite: 2]
            if (cardElement) cardElement.remove();

            // Closes modal window[cite: 2]
            closeModal();

            // Refresh user collection stats/grid
            // Re-fetches current user's collection if user is logged in[cite: 2]
            if (currentUser) loadUserCollection(currentUser.uid);
        // Catches errors thrown during deletion workflow[cite: 2]
        } catch (error) {
            // Logs detailed deletion error to browser console[cite: 2]
            console.error("Error deleting recipe from Firestore:", error);
            // Alerts user of failure using pop-up alert[cite: 2]
            alert("Lỗi khi xóa công thức: " + error.message);
        }
    });
};

// Assigns instruction popup handler to global window object[cite: 2]
window.handleShowInstructions = function(recipeId, isUserCollection = false) {
    // Declares local variable to hold found recipe[cite: 2]
    let recipe;
    
    // Checks if searching inside user's saved collection context[cite: 2]
    if (isUserCollection) {
        // Searches local userSavedRecipes array matching given ID[cite: 2]
        recipe = userSavedRecipes.find(r => String(r.id) === String(recipeId));
    // Fallback context: external public recipes[cite: 2]
    } else {
        // Finds matching card element in page layout[cite: 2]
        const cardElem = document.querySelector(`.card[data-id="${recipeId}"]`);
        // Constructs object reading fallback properties from element attributes[cite: 2]
        recipe = {
            title: cardElem?.dataset?.title || cardElem?.querySelector(".card-title")?.innerText || "Recipe Instructions",
            instructions: cardElem?.dataset?.instructions || "No detailed instructions available."
        };
    }

    // Checks if instructions are missing or set to placeholder messages[cite: 2]
    if (!recipe || !recipe.instructions || recipe.instructions === "No detailed instructions available." || recipe.instructions === "No instructions available.") {
        // Searches API cache array for the meal matching ID[cite: 2]
        const foundMeal = window.currentFetchedMeals?.find(m => String(m.idMeal) === String(recipeId));
        // Overwrites object with full meal data if found in cache[cite: 2]
        if (foundMeal) {
            recipe = {
                title: foundMeal.strMeal,
                instructions: foundMeal.strInstructions
            };
        }
    }

    // Opens instructions modal with found recipe or fallback data object[cite: 2]
    openInstructionsModal(recipe || { title: "Instructions", instructions: "No instructions available." });
};

// Assigns edit recipe handler to global window object[cite: 2]
window.handleEditRecipe = function(recipeId) {
    // Robust search looking up both userSavedRecipes array and DOM data attributes
    // Searches user saved recipes array in memory[cite: 2]
    let recipe = userSavedRecipes.find(r => String(r.id) === String(recipeId));
    
    // Fallback logic if recipe object was not found in memory[cite: 2]
    if (!recipe) {
        // Queries card element by attribute[cite: 2]
        const cardElem = document.querySelector(`.card[data-id="${recipeId}"]`);
        // Reads data directly from elements in DOM[cite: 2]
        if (cardElem) {
            recipe = {
                id: recipeId,
                title: cardElem.dataset.title || cardElem.querySelector(".card-title")?.innerText || "",
                category: cardElem.querySelector(".category-tag")?.innerText || "",
                image: cardElem.querySelector("img")?.src || "",
                instructions: cardElem.dataset.instructions || ""
            };
        }
    }

    // Opens edit modal if valid recipe data was extracted[cite: 2]
    if (recipe) {
        openEditModal(recipe);
    // Alerts user if recipe details could not be retrieved[cite: 2]
    } else {
        alert("Recipe details could not be found.");
    }
};

// 3. API FETCH & RENDER
// Exports asynchronous function to fetch external public recipes based on a query[cite: 2]
export async function fetchExternalRecipes(queryStr = "All") {
    // Retrieves public recipe grid container element from DOM[cite: 2]
    const grid = document.getElementById("public-recipes-grid");
    // Exits function if container grid element does not exist in document[cite: 2]
    if (!grid) return;
    
    // Shows loading message to user[cite: 2]
    grid.innerHTML = "<p>Loading recipes...</p>";
    // Trims whitespace from query string[cite: 2]
    const originalTerm = queryStr.trim();
    // Converts query string to lower case[cite: 2]
    const searchTerm = originalTerm.toLowerCase();
    // Normalizes query string for API search endpoint[cite: 2]
    const apiQuery = (!searchTerm || searchTerm === "all" || searchTerm === "quick meals") ? "" : searchTerm;

    // Wraps API network call in try block[cite: 2]
    try {
        // Fetches external recipe data from TheMealDB API[cite: 2]
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(apiQuery)}`);
        // Parses network JSON response body[cite: 2]
        const data = await res.json();
        
        // Clears loading markup from grid element[cite: 2]
        grid.innerHTML = "";
        // Displays error text if no meal records were found[cite: 2]
        if (!data.meals) {
            grid.innerHTML = "<p>No recipes found matching your search.</p>";
            return;
        }

        // Stores response meals list in global memory cache[cite: 2]
        window.currentFetchedMeals = data.meals;

        // Iterates through retrieved meals and builds display cards[cite: 2]
        data.meals.forEach(meal => {
            // Invokes card generator helper function[cite: 2]
            const cardElem = createRecipeCard({
                id: meal.idMeal,
                title: meal.strMeal,
                image: meal.strMealThumb,
                category: meal.strCategory,
                instructions: meal.strInstructions || "No instructions available for this recipe."
            }, false);
            // Appends constructed card DOM node into display grid[cite: 2]
            grid.appendChild(cardElem);
        });

        // Updates dynamic category buttons on page UI[cite: 2]
        updateAlgorithmicCategories(originalTerm, data.meals);
    // Catches network errors[cite: 2]
    } catch (err) {
        // Displays error message on page UI[cite: 2]
        grid.innerHTML = "<p>Error loading recipes. Please check your connection.</p>";
    }
}

// Function to calculate dynamic category tags based on search results[cite: 2]
export function updateAlgorithmicCategories(searchedTerm, meals = []) {
    // Locates category tag bar element[cite: 2]
    const categoriesBar = document.getElementById("algorithmic-categories");
    // Returns if bar element is not present on the page[cite: 2]
    if (!categoriesBar) return;

    // Extracts unique list of category strings from meals[cite: 2]
    const fetchedCategories = Array.from(new Set(meals.map(m => m.strCategory).filter(Boolean)));
    // Sets base static categories[cite: 2]
    const baseCategories = ["All", "Chicken", "Beef", "Pasta", "Dessert", "Seafood"];
    // Merges unique categories and caps array length to 7 items[cite: 2]
    const suggestedCategories = Array.from(new Set(["All", ...fetchedCategories, ...baseCategories])).slice(0, 7);

    // Renders HTML category tags with active state styling[cite: 2]
    categoriesBar.innerHTML = suggestedCategories
        .map(cat => `<span class="category-tag ${cat.toLowerCase() === searchedTerm.toLowerCase() ? 'active' : ''}">${cat}</span>`)
        .join("");

    // Attaches click listeners to all generated category tags[cite: 2]
    document.querySelectorAll(".category-tag").forEach(tag => {
        tag.addEventListener("click", (e) => {
            // Reads clicked category name[cite: 2]
            const category = e.target.innerText;
            // Refreshes public recipes using chosen category[cite: 2]
            fetchExternalRecipes(category);
            // Refreshes tutorial videos using chosen category[cite: 2]
            loadTutorialVideos(category);
        });
    });
}

// 4. MODAL DISPLAY LOGIC
// Replace openInstructionsModal in script.js
// Displays instruction text inside specific modal[cite: 2]
function openInstructionsModal(recipe) {
    // Gets recipe title element inside modal[cite: 2]
    const titleElem = document.getElementById("modal-recipe-title");
    // Gets instruction content body element inside modal[cite: 2]
    const contentElem = document.getElementById("modal-instructions-content");
    // Gets modal overlay wrapper element[cite: 2]
    const modal = document.getElementById("instructions-modal");

    // Validates existence of all modal elements before operations[cite: 2]
    if (titleElem && contentElem && modal) {
        // Injects title text[cite: 2]
        titleElem.textContent = recipe.title || "Recipe Instructions";
        // Injects instructions text[cite: 2]
        contentElem.innerText = recipe.instructions || "No detailed instructions provided.";
        // Unhides modal element by removing hidden CSS class[cite: 2]
        modal.classList.remove("hidden");
        // Force layout display[cite: 2]
        modal.style.display = "flex";
    }
}

// Displays modal dialog containing recipe editing form[cite: 2]
function openEditModal(recipe) {
    // Restricts editing access if user is not authenticated[cite: 2]
    if (!currentUser) return alert("Vui lòng đăng nhập để chỉnh sửa công thức!");

    // Store original image URL as fallback
    // Resolves recipe image path[cite: 2]
    let updatedImageUrl = recipe.image || recipe.imageUrl || "https://via.placeholder.com/300";

    // Opens dynamic popup modal containing input controls[cite: 2]
    openModal(`
        <h3>Chỉnh Sửa Công Thức</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
            <div>
                <label style="font-weight: 600; display: block; margin-bottom: 4px;">Tên công thức *</label>
                <input type="text" id="edit-title" value="${recipe.title || ''}" class="modal-input" required>
            </div>
            <div>
                <label style="font-weight: 600; display: block; margin-bottom: 4px;">Danh mục</label>
                <input type="text" id="edit-cat" value="${recipe.category || ''}" class="modal-input">
            </div>
            <div>
                <label style="font-weight: 600; display: block; margin-bottom: 4px;">Hình ảnh</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button type="button" id="edit-upload-widget-btn" class="btn btn-outline">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Tải ảnh mới
                    </button>
                    <span id="edit-upload-status" style="font-size: 0.85rem; color: #666;">Đang sử dụng ảnh hiện tại</span>
                </div>
                <div id="edit-image-preview-container" style="margin-top: 8px;">
                    <img id="edit-image-preview" src="${updatedImageUrl}" alt="Preview" style="max-height: 120px; border-radius: 8px; object-fit: cover;">
                </div>
            </div>
            <div>
                <label style="font-weight: 600; display: block; margin-bottom: 4px;">Nguyên liệu</label>
                <textarea id="edit-ingredients" class="modal-input" rows="3" style="resize: vertical; font-family: inherit;">${recipe.ingredients || ''}</textarea>
            </div>
            <div>
                <label style="font-weight: 600; display: block; margin-bottom: 4px;">Hướng dẫn chế biến</label>
                <textarea id="edit-instructions" class="modal-input" rows="4" style="resize: vertical; font-family: inherit;">${recipe.instructions || ''}</textarea>
            </div>
            <button type="button" id="save-edit-btn" class="btn btn-primary" style="margin-top: 10px;">Lưu Thay Đổi</button>
        </div>
    `);

    // Attach Cloudinary Upload Widget Listener
    // Gets button node triggering Cloudinary widget[cite: 2]
    const editUploadBtn = document.getElementById("edit-upload-widget-btn");
    // Ensures Cloudinary script library is loaded[cite: 2]
    if (editUploadBtn && window.cloudinary) {
        // Instantiates Cloudinary upload widget instance[cite: 2]
        const widget = window.cloudinary.createUploadWidget(
            {
                // Configures Cloudinary cloud name parameter[cite: 2]
                cloudName: "jfymknrw",
                // Configures Cloudinary unsigned upload preset parameter[cite: 2]
                uploadPreset: "ml_default"
            },
            // Callback execution handling upload events[cite: 2]
            (error, result) => {
                // Checks for successful upload completion[cite: 2]
                if (!error && result && result.event === "success") {
                    // Stores resulting secure image URL[cite: 2]
                    updatedImageUrl = result.info.secure_url;

                    // Gets status text span element[cite: 2]
                    const statusElem = document.getElementById("edit-upload-status");
                    // Gets preview image element node[cite: 2]
                    const previewImg = document.getElementById("edit-image-preview");

                    // Updates status label[cite: 2]
                    if (statusElem) statusElem.innerText = "Tải ảnh thành công!";
                    // Updates preview image source attribute[cite: 2]
                    if (previewImg) previewImg.src = updatedImageUrl;
                }
            }
        );

        // Binds click event listener opening upload widget[cite: 2]
        editUploadBtn.addEventListener("click", () => widget.open(), false);
    }

    // Save Action Listener
    // Attaches submit listener to update recipe changes[cite: 2]
    document.getElementById("save-edit-btn")?.addEventListener("click", async () => {
        // Reads title input[cite: 2]
        const title = document.getElementById("edit-title").value.trim();
        // Reads category input with fallback[cite: 2]
        const category = document.getElementById("edit-cat").value.trim() || "General";
        // Reads ingredients input text[cite: 2]
        const ingredients = document.getElementById("edit-ingredients").value.trim();
        // Reads instructions input text[cite: 2]
        const instructions = document.getElementById("edit-instructions").value.trim();

        // Validates required title field[cite: 2]
        if (!title) return alert("Vui lòng nhập tên công thức.");

        // Wraps Firestore update call in try block[cite: 2]
        try {
            // Checks if recipe ID and logged-in user exist[cite: 2]
            if (recipe.id && currentUser) {
                // Updates recipe document in Firestore database[cite: 2]
                await updateDoc(doc(db, "recipes", String(recipe.id)), { 
                    title, 
                    category, 
                    image: updatedImageUrl, 
                    ingredients, 
                    instructions 
                });
                // Displays success message alert[cite: 2]
                alert("Cập nhật công thức thành công!");
                // Closes edit modal window[cite: 2]
                closeModal();
                // Reloads user saved recipes grid[cite: 2]
                loadUserCollection(currentUser.uid);
            }
        // Handles errors during update process[cite: 2]
        } catch (err) {
            // Logs error details to developer browser console[cite: 2]
            console.error("Lỗi khi cập nhật công thức:", err);
            // Alerts user of error encountered[cite: 2]
            alert("Không thể cập nhật công thức: " + err.message);
        }
    });
}

// Binds closing event listeners for static popups[cite: 2]
function setupPopupModals() {
    // Gets close button node[cite: 2]
    const closeBtn = document.getElementById("close-instructions-modal");
    // Attaches click listener if element exists[cite: 2]
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            // Locates instructions modal wrapper[cite: 2]
            const modal = document.getElementById("instructions-modal");
            // Hides modal element[cite: 2]
            if (modal) {
                modal.classList.add("hidden");
                modal.style.display = "none";
            }
        });
    }

    // Listens for clicks on window overlay background[cite: 2]
    window.addEventListener("click", (e) => {
        // Checks if click target was the overlay element[cite: 2]
        if (e.target.classList.contains("modal-overlay")) {
            // Hides overlay popup modal[cite: 2]
            e.target.classList.add("hidden");
            e.target.style.display = "none";
        }
    });
}

// Helper function extracting 11-character YouTube video ID using Regex matching[cite: 2]
export function extractYouTubeId(url) {
    // Returns null if URL string is missing[cite: 2]
    if (!url) return null;
    // Regular expression pattern matching various YouTube URL formats[cite: 2]
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    // Matches input URL against regular expression[cite: 2]
    const match = url.match(regExp);
    // Returns extracted ID string if valid 11 chars long, otherwise returns null[cite: 2]
    return (match && match[2].length === 11) ? match[2] : null;
}

// Loads and renders YouTube tutorial video embeds based on active category filter[cite: 2]
export async function loadTutorialVideos(filterTerm = "All") {
    // Retrieves video container grid element[cite: 2]
    const grid = document.getElementById("videos-grid");
    // Exits function if container missing from current view[cite: 2]
    if (!grid) return;

    // Shows loading indicator inside container grid[cite: 2]
    grid.innerHTML = "<p>Loading video tutorials...</p>";
    // Normalizes search term[cite: 2]
    const term = filterTerm.trim().toLowerCase();
    // Prepares API search string[cite: 2]
    const apiQuery = (!term || term === "all") ? "" : term;

    // Declares container array for extracted video objects[cite: 2]
    let videos = [];

    // Wraps API network call inside try block[cite: 2]
    try {
        // Calls API to fetch recipes with video references[cite: 2]
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(apiQuery)}`);
        // Parses response body to JSON format[cite: 2]
        const data = await res.json();

        // Validates returned meal records[cite: 2]
        if (data.meals) {
            // Loops through meals to parse YouTube embedded links[cite: 2]
            data.meals.forEach(meal => {
                // Extracts video ID[cite: 2]
                const embedId = extractYouTubeId(meal.strYoutube);
                // Appends parsed video record to list[cite: 2]
                if (embedId) {
                    videos.push({
                        title: `${meal.strMeal} Tutorial`,
                        category: meal.strCategory || "General",
                        embedId: embedId
                    });
                }
            });
        }
    // Catches and logs errors quietly[cite: 2]
    } catch (err) {
        console.warn("Could not load API videos.", err);
    }

    // Provides fallback tutorial videos if none were extracted[cite: 2]
    if (videos.length === 0) {
        videos = [
            { title: "Mastering Basic Culinary Techniques", category: "Basics", embedId: "G-Fg7l7G1zw" },
            { title: "Essential Cooking Methods", category: "General", embedId: "2a34vO528iA" }
        ];
    }

    // Clears inner HTML content of grid[cite: 2]
    grid.innerHTML = "";
    // Iterates over first 6 videos to build embed frames[cite: 2]
    videos.slice(0, 6).forEach(vid => {
        // Creates container element for video item[cite: 2]
        const card = document.createElement("div");
        // Assigns card CSS class[cite: 2]
        card.className = "card";
        // Populates iframe embed markup inside card container[cite: 2]
        card.innerHTML = `
            <iframe 
                width="100%" 
                height="200" 
                src="https://www.youtube-nocookie.com/embed/${vid.embedId}" 
                title="${vid.title}"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
            <div class="card-body">
                <h4>${vid.title}</h4>
                <p><strong>Category:</strong> ${vid.category}</p>
            </div>
        `;
        // Appends constructed video card to UI grid[cite: 2]
        grid.appendChild(card);
    });
}

// Asynchronously fetches user's saved recipes collection from Firestore database[cite: 2]
export async function loadUserCollection(userId) {
    // Exits early if user ID is missing[cite: 2]
    if (!userId) return;
    // Creates Firestore query matching userId field[cite: 2]
    const q = query(collection(db, "recipes"), where("userId", "==", userId));
    // Fetches snapshot matching created query[cite: 2]
    const querySnapshot = await getDocs(q);
    
    // Retrieves collection UI grid element[cite: 2]
    const grid = document.getElementById("my-recipes-grid");
    // Exits if UI element is absent[cite: 2]
    if (!grid) return;

    // Clears existing user recipes from container grid[cite: 2]
    grid.innerHTML = "";
    // Resets memory tracking array[cite: 2]
    userSavedRecipes = [];

    // Iterates through retrieved database document snapshots[cite: 2]
    querySnapshot.forEach((docSnap) => {
        // Assembles object containing document ID and data fields[cite: 2]
        const item = { id: docSnap.id, ...docSnap.data() };
        // Appends item to local user saved recipes array[cite: 2]
        userSavedRecipes.push(item);
        // Generates card element and appends it to DOM container grid[cite: 2]
        grid.appendChild(createRecipeCard(item, true));
    });

    // Retrieves total count display element[cite: 2]
    const statSaved = document.getElementById("stat-saved");
    // Updates saved count text in user stats[cite: 2]
    if (statSaved) statSaved.innerText = userSavedRecipes.length;
}

// Asynchronously saves new recipe object to Firestore database under user ID[cite: 2]
export async function saveToUserCollection(recipe) {
    // Restricts saving if user is unauthenticated[cite: 2]
    if (!currentUser) return alert("Vui lòng đăng nhập để lưu món ăn!");

    // Wraps database write request in try block[cite: 2]
    try {
        // Adds document to 'recipes' collection in Firestore[cite: 2]
        await addDoc(collection(db, "recipes"), {
            userId: currentUser.uid,
            title: recipe.title,
            image: recipe.image,
            category: recipe.category,
            instructions: recipe.instructions || "No instructions provided for this recipe.",
            createdAt: new Date()
        });

        // Displays success alert pop-up[cite: 2]
        alert("Đã thêm món ăn vào bộ sưu tập!");
        // Reloads collection to render newly added recipe card[cite: 2]
        loadUserCollection(currentUser.uid);
    // Catches write errors[cite: 2]
    } catch (error) {
        // Logs error details to browser console[cite: 2]
        console.error("Error saving recipe:", error);
        // Displays user error alert[cite: 2]
        alert("Lỗi khi lưu món ăn. Vui lòng thử lại.");
    }
}

// Configures interactive dialog form for adding custom user recipes[cite: 2]
export function setupAddCustomRecipe() {
    // Gets button node triggering add recipe modal[cite: 2]
    const addRecipeBtn = document.getElementById("add-recipe-btn");
    // Checks if button element exists[cite: 2]
    if (addRecipeBtn) {
        // Binds click event listener to display dynamic form[cite: 2]
        addRecipeBtn.addEventListener("click", () => {
            // Guards execution if user is unauthenticated[cite: 2]
            if (!currentUser) return alert("Vui lòng đăng nhập để thêm công thức mới.");

            // Declares image URL with default placeholder[cite: 2]
            let uploadedImageUrl = "https://via.placeholder.com/300";

            // Opens dynamic popup modal containing form elements[cite: 2]
            openModal(`
                <h3>Add New Custom Recipe</h3>
                <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 4px;">Recipe Title *</label>
                        <input type="text" id="custom-title" placeholder="e.g., Spaghetti Carbonara" class="modal-input" required>
                    </div>
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 4px;">Category</label>
                        <input type="text" id="custom-cat" placeholder="e.g., Pasta, Dessert, Beef" class="modal-input">
                    </div>
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 4px;">Recipe Image</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <button type="button" id="upload-widget-btn" class="btn btn-outline">
                                <i class="fa-solid fa-cloud-arrow-up"></i> Upload Image
                            </button>
                            <span id="upload-status" style="font-size: 0.85rem; color: #666;">No image selected</span>
                        </div>
                        <div id="image-preview-container" style="margin-top: 8px; display: none;">
                            <img id="image-preview" src="" alt="Preview" style="max-height: 120px; border-radius: 8px; object-fit: cover;">
                        </div>
                    </div>
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 4px;">Ingredients</label>
                        <textarea id="custom-ingredients" placeholder="Ingredients list..." class="modal-input" rows="3" style="resize: vertical; font-family: inherit;"></textarea>
                    </div>
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 4px;">Instructions / How to Cook</label>
                        <textarea id="custom-instructions" placeholder="Step-by-step cooking instructions..." class="modal-input" rows="4" style="resize: vertical; font-family: inherit;"></textarea>
                    </div>
                    <button type="button" id="save-custom-btn" class="btn btn-primary" style="margin-top: 10px;">Add Recipe</button>
                </div>
            `);

            // Configure Cloudinary Upload Widget
            // Gets upload widget button node[cite: 2]
            const uploadBtn = document.getElementById("upload-widget-btn");
            // Validates presence of upload button and Cloudinary SDK[cite: 2]
            if (uploadBtn && window.cloudinary) {
                // Initializes Cloudinary upload widget[cite: 2]
                const widget = window.cloudinary.createUploadWidget(
                    {
                        // Sets Cloudinary account name[cite: 2]
                        cloudName: "jfymknrw",
                        // Sets Cloudinary unsigned upload preset[cite: 2]
                        uploadPreset: "ml_default"
                    },
                    // Upload event listener callback[cite: 2]
                    (error, result) => {
                        // Checks for successful upload[cite: 2]
                        if (!error && result && result.event === "success") {
                            // Assigns returned secure URL string[cite: 2]
                            uploadedImageUrl = result.info.secure_url;
                            
                            // Gets DOM elements for status display[cite: 2]
                            const statusElem = document.getElementById("upload-status");
                            const previewContainer = document.getElementById("image-preview-container");
                            const previewImg = document.getElementById("image-preview");

                            // Updates status string and reveals image preview[cite: 2]
                            if (statusElem) statusElem.innerText = "Upload successful!";
                            if (previewImg) previewImg.src = uploadedImageUrl;
                            if (previewContainer) previewContainer.style.display = "block";
                        }
                    }
                );

                // Attaches event handler to launch upload widget[cite: 2]
                uploadBtn.addEventListener("click", () => widget.open(), false);
            }

            // Save action listener
            // Attaches event handler to submit custom recipe form[cite: 2]
            document.getElementById("save-custom-btn")?.addEventListener("click", async () => {
                // Reads title form field[cite: 2]
                const title = document.getElementById("custom-title").value.trim();
                // Reads category form field[cite: 2]
                const category = document.getElementById("custom-cat").value.trim() || "General";
                // Reads ingredients form field[cite: 2]
                const ingredients = document.getElementById("custom-ingredients").value.trim();
                // Reads instructions form field[cite: 2]
                const instructions = document.getElementById("custom-instructions").value.trim() || "No detailed instructions provided.";

                // Checks title validity[cite: 2]
                if (!title) return alert("Vui lòng nhập tên công thức.");

                // Wraps database document insertion call in try block[cite: 2]
                try {
                    // Writes new custom recipe record to Cloud Firestore[cite: 2]
                    await addDoc(collection(db, "recipes"), {
                        userId: currentUser.uid,
                        title, 
                        category, 
                        image: uploadedImageUrl, 
                        ingredients, 
                        instructions, 
                        createdAt: new Date()
                    });

                    // Closes open creation modal[cite: 2]
                    closeModal();
                    // Refreshes saved collection UI grid[cite: 2]
                    loadUserCollection(currentUser.uid);
                // Catches and alerts creation failures[cite: 2]
                } catch (error) {
                    console.error("Lỗi thêm công thức: ", error);
                    alert("Không thể lưu công thức. Vui lòng thử lại.");
                }
            });
        });
    }
}

// 5. UNIVERSAL EVENT DELEGATION
// Sets up global document click listener using event delegation pattern[cite: 2]
document.addEventListener("click", (e) => {
    // Instructions Button
    // Finds nearest ancestor with instructions class[cite: 2]
    const instructionsBtn = e.target.closest(".btn-instructions");
    // Processes click if instructions button triggered event[cite: 2]
    if (instructionsBtn) {
        // Reads recipe ID data attribute[cite: 2]
        const recipeId = instructionsBtn.dataset.id;
        // Determines if button lives inside user recipes collection grid[cite: 2]
        const isUserCol = instructionsBtn.closest("#my-recipes-grid") !== null;
        // Triggers instructions modal display handler[cite: 2]
        window.handleShowInstructions(recipeId, isUserCol);
        // Terminate delegation handler processing[cite: 2]
        return;
    }

    // Change / Edit Button
    // Finds nearest ancestor element with edit class[cite: 2]
    const editBtn = e.target.closest(".btn-edit");
    // Processes click if edit button triggered event[cite: 2]
    if (editBtn) {
        // Reads recipe ID data attribute[cite: 2]
        const recipeId = editBtn.dataset.id;
        // Triggers edit modal display handler[cite: 2]
        window.handleEditRecipe(recipeId);
        // Terminate delegation handler processing[cite: 2]
        return;
    }

    // Save Button
    // Finds nearest ancestor element with save class[cite: 2]
    const saveBtn = e.target.closest(".save-recipe-btn");
    // Processes click if save button triggered event[cite: 2]
    if (saveBtn) {
        // Reads recipe ID data attribute[cite: 2]
        const recipeId = saveBtn.dataset.id;
        // Locates meal record within API fetch memory cache[cite: 2]
        const foundMeal = window.currentFetchedMeals?.find(m => String(m.idMeal) === String(recipeId));
        // Saves recipe object into Firestore database if meal found[cite: 2]
        if (foundMeal) {
            saveToUserCollection({
                title: foundMeal.strMeal,
                image: foundMeal.strMealThumb,
                category: foundMeal.strCategory,
                instructions: foundMeal.strInstructions
            });
        }
        // Terminate delegation handler processing[cite: 2]
        return;
    }

    // Delete Button
    // Finds nearest ancestor element with delete class[cite: 2]
    const deleteBtn = e.target.closest(".btn-delete-recipe");
    // Processes click if delete button triggered event[cite: 2]
    if (deleteBtn) {
        // Reads recipe ID data attribute[cite: 2]
        const recipeId = deleteBtn.dataset.id;
        // Triggers deletion process modal[cite: 2]
        window.handleDeleteSavedRecipe(recipeId);
        // Terminate delegation handler processing[cite: 2]
        return;
    }
});

// INITIALIZE APP
// Attaches initialization block executing when DOM is ready[cite: 2]
document.addEventListener("DOMContentLoaded", () => {
    // Runs navigation setup with safety catch block[cite: 2]
    try { setupNavigation(); } catch(e) { console.warn("setupNavigation error:", e); }
    // Runs search bar setup with safety catch block[cite: 2]
    try { setupSearch(); } catch(e) { console.warn("setupSearch error:", e); }
    // Runs modal setup with safety catch block[cite: 2]
    try { setupModal(); } catch(e) { console.warn("setupModal error:", e); }
    // Runs custom recipe listeners setup with safety catch block[cite: 2]
    try { setupAddCustomRecipe(); } catch(e) { console.warn("setupAddCustomRecipe error:", e); }
    // Runs static popups setup with safety catch block[cite: 2]
    try { setupPopupModals(); } catch(e) { console.warn("setupPopupModals error:", e); }
    
    // Fetches initial default list of public recipes[cite: 2]
    fetchExternalRecipes("All");
    // Fetches initial default list of tutorial videos[cite: 2]
    loadTutorialVideos("All");
});