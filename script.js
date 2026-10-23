/**
 * PawnZM - Marketplace Client Engine
 * Dynamically fetches and posts live listings via backend API endpoints.
 */

let PRODUCTS = [];
let activeCategory = "all";
let searchQuery = "";

// Inline SVG icon from the sprite in index.html
const icon = (name) => `<svg class="icon"><use href="#i-${name}"/></svg>`;

// DOM Elements
const productGrid = document.getElementById("product-grid");
const searchInput = document.getElementById("search-input");
const categoryCards = document.querySelectorAll(".category-card");

// Modal Elements
const listingModal = document.getElementById("listing-modal");
const openModalBtn = document.getElementById("open-modal-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const cancelModalBtn = document.getElementById("cancel-modal-btn");
const createListingForm = document.getElementById("create-listing-form");

// File Upload Elements
const fileInput = document.getElementById("item-image-file");
const filePreviewContainer = document.getElementById("file-preview-container");
const filePreview = document.getElementById("file-preview");
const fileNameSpan = document.getElementById("file-name");

// Detail View Modal Elements
const detailModal = document.getElementById("detail-modal");
const closeDetailModalBtn = document.getElementById("close-detail-modal-btn");
const detailModalContent = document.getElementById("detail-modal-content");

function init() {
    fetchProducts();
    setupEventListeners();
}

// Fetch all listings from MySQL database via PHP API
async function fetchProducts() {
    try {
        const response = await fetch("get_products.php");
        if (!response.ok) throw new Error("Failed to load products");
        PRODUCTS = await response.json();
        renderProducts();
    } catch (error) {
        console.error("Error fetching products:", error);
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Unable to load listings. Check your database connection.</p>`;
    }
}

function renderProducts() {
    productGrid.innerHTML = "";

    const filtered = PRODUCTS.filter(p => {
        const matchesCategory = activeCategory === "all" || p.category === activeCategory;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.seller.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">No listings found in this category.</p>`;
        return;
    }

    filtered.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <div class="product-img-wrapper">
                <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">
                <button class="heart-btn" aria-label="Save listing">${icon('heart')}</button>
            </div>
            <div class="product-info">
                <div class="product-title">${escapeHtml(product.title)}</div>
                <div class="seller-row">
                    <img src="${product.sellerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop'}" class="seller-avatar" alt="${escapeHtml(product.seller)}">
                    <span class="product-price">K${parseFloat(product.price).toLocaleString('en-US')}</span>
                    <span class="seller-name">${escapeHtml(product.seller)}</span>
                    <span class="product-location">${icon('map-pin')} ${escapeHtml(product.location)}</span>
                </div>
            </div>
        `;

        card.addEventListener("click", (e) => {
            if (e.target.closest(".heart-btn")) return;
            openProductDetail(product);
        });

        productGrid.appendChild(card);
    });
}

function openProductDetail(product) {
    detailModalContent.innerHTML = `
        <div class="detail-img-container">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">
        </div>
        <div class="detail-content">
            <div class="detail-tag">${escapeHtml(product.category)}</div>
            <div class="detail-top-row">
                <h2 class="detail-title">${escapeHtml(product.title)}</h2>
                <div class="detail-price">K${parseFloat(product.price).toLocaleString('en-US')}</div>
            </div>
            
            <div class="detail-seller-box">
                <img src="${product.sellerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop'}" class="detail-seller-avatar" alt="${escapeHtml(product.seller)}">
                <div class="detail-seller-info">
                    <span class="detail-seller-name">${escapeHtml(product.seller)}</span>
                    <span class="detail-location">${icon('map-pin')} ${escapeHtml(product.location)}</span>
                </div>
            </div>

            <div>
                <div class="detail-description-title">Description</div>
                <p class="detail-description">${escapeHtml(product.description || "No description provided.")}</p>
            </div>

            <div class="contact-box">
                <button class="btn btn-hero btn-contact" id="contact-seller-btn">Contact Seller</button>
                <div class="contact-info-revealed hidden" id="contact-info-revealed">
                    ${icon('phone')} ${escapeHtml(product.contact || "Contact info not provided")}
                </div>
            </div>
        </div>
    `;

    const contactBtn = document.getElementById("contact-seller-btn");
    const contactInfo = document.getElementById("contact-info-revealed");
    
    contactBtn.addEventListener("click", () => {
        contactInfo.classList.toggle("hidden");
    });

    detailModal.classList.remove("hidden");
}

function setupEventListeners() {
    categoryCards.forEach(card => {
        card.addEventListener("click", () => {
            categoryCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            activeCategory = card.dataset.category;
            renderProducts();
        });
    });

    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim();
        renderProducts();
    });

    openModalBtn.addEventListener("click", () => listingModal.classList.remove("hidden"));
    closeModalBtn.addEventListener("click", resetAndCloseModal);
    cancelModalBtn.addEventListener("click", resetAndCloseModal);

    closeDetailModalBtn.addEventListener("click", () => detailModal.classList.add("hidden"));

    window.addEventListener("click", (e) => {
        if (e.target === listingModal) resetAndCloseModal();
        if (e.target === detailModal) detailModal.classList.add("hidden");
    });

    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                filePreview.src = evt.target.result;
                fileNameSpan.textContent = file.name;
                filePreviewContainer.classList.remove("hidden");
            };
            reader.readAsDataURL(file);
        } else {
            filePreviewContainer.classList.add("hidden");
        }
    });

    // POST Form Data to Backend PHP
    createListingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const formData = new FormData(createListingForm);

        try {
            const response = await fetch("add_product.php", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                resetAndCloseModal();
                fetchProducts(); // Refresh listings from database
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            console.error("Submission failed:", error);
            alert("Failed to publish listing. Ensure backend server is running.");
        }
    });
}

function resetAndCloseModal() {
    createListingForm.reset();
    filePreviewContainer.classList.add("hidden");
    listingModal.classList.add("hidden");
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[m]));
}

document.addEventListener("DOMContentLoaded", init);
