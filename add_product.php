<?php
header("Content-Type: application/json");
require_once "db.php";

function respond(bool $success, string $message, int $status = 200): void {
    http_response_code($status);
    echo json_encode(["success" => $success, "message" => $message]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    respond(false, "Method not allowed", 405);
}

// ---------- Config ----------
const ALLOWED_CATEGORIES = [
    "electronics", "vehicles", "thrift", "fashion",
    "furniture", "collectibles", "industrial"
];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TO_EXT = [
    "image/jpeg" => "jpg",
    "image/png"  => "png",
    "image/webp" => "webp",
];

// ---------- Collect and trim ----------
$title       = trim($_POST["title"] ?? "");
$priceRaw    = trim($_POST["price"] ?? "");
$category    = trim($_POST["category"] ?? "");
$seller      = trim($_POST["seller"] ?? "");
$location    = trim($_POST["location"] ?? "");
$contact     = trim($_POST["contact"] ?? "");
$description = trim($_POST["description"] ?? "");

// ---------- Validate text fields ----------
if ($title === "" || mb_strlen($title) > 100) {
    respond(false, "Title is required (max 100 characters).", 422);
}
if ($seller === "" || mb_strlen($seller) > 60) {
    respond(false, "Seller name is required (max 60 characters).", 422);
}
if ($location === "" || mb_strlen($location) > 80) {
    respond(false, "Location is required (max 80 characters).", 422);
}
if (mb_strlen($description) > 2000) {
    respond(false, "Description is too long (max 2000 characters).", 422);
}
if (!in_array($category, ALLOWED_CATEGORIES, true)) {
    respond(false, "Invalid category.", 422);
}

// Price: numeric, positive, sane upper bound
if (!is_numeric($priceRaw)) {
    respond(false, "Price must be a number.", 422);
}
$price = (float)$priceRaw;
if ($price <= 0 || $price > 100000000) {
    respond(false, "Price must be greater than 0.", 422);
}

// Contact: a phone number or an email
$isPhone = preg_match('/^\+?[0-9][0-9\s\-()]{6,19}$/', $contact) === 1;
$isEmail = filter_var($contact, FILTER_VALIDATE_EMAIL) !== false;
if (!$isPhone && !$isEmail) {
    respond(false, "Enter a valid phone number or email address.", 422);
}

// ---------- Validate image ----------
if (!isset($_FILES["image"]) || $_FILES["image"]["error"] !== UPLOAD_ERR_OK) {
    $err = $_FILES["image"]["error"] ?? UPLOAD_ERR_NO_FILE;
    if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) {
        respond(false, "Image is too large.", 413);
    }
    respond(false, "An image file is required.", 422);
}

$file = $_FILES["image"];

if (!is_uploaded_file($file["tmp_name"])) {
    respond(false, "Invalid upload.", 400);
}
if ($file["size"] <= 0 || $file["size"] > MAX_IMAGE_BYTES) {
    respond(false, "Image must be under 5 MB.", 413);
}

// Detect the real type from file contents, not from the filename or browser
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = $finfo->file($file["tmp_name"]);
if (!isset(ALLOWED_MIME_TO_EXT[$mime])) {
    respond(false, "Only JPG, PNG or WEBP images are allowed.", 415);
}

// Second check: must actually parse as an image
if (@getimagesize($file["tmp_name"]) === false) {
    respond(false, "File is not a valid image.", 415);
}

// We pick the extension ourselves from the detected type
$ext = ALLOWED_MIME_TO_EXT[$mime];

// ---------- Save file ----------
$uploadDirFs  = __DIR__ . "/uploads/";
$uploadDirUrl = "uploads/";

if (!is_dir($uploadDirFs) && !mkdir($uploadDirFs, 0755, true)) {
    error_log("PawnZM: could not create upload dir");
    respond(false, "Server error. Please try again later.", 500);
}

$fileName     = bin2hex(random_bytes(16)) . "." . $ext;
$targetFs     = $uploadDirFs . $fileName;
$targetForDb  = $uploadDirUrl . $fileName;

if (!move_uploaded_file($file["tmp_name"], $targetFs)) {
    error_log("PawnZM: move_uploaded_file failed");
    respond(false, "Failed to save the image.", 500);
}
chmod($targetFs, 0644);

// ---------- Insert ----------
$stmt = $conn->prepare(
    "INSERT INTO products (title, price, category, seller, location, contact, description, image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);
if (!$stmt) {
    unlink($targetFs);
    error_log("PawnZM prepare failed: " . $conn->error);
    respond(false, "Server error. Please try again later.", 500);
}

$stmt->bind_param("sdssssss", $title, $price, $category, $seller, $location, $contact, $description, $targetForDb);

if ($stmt->execute()) {
    $stmt->close();
    $conn->close();
    respond(true, "Product posted successfully");
}

// DB insert failed: don't leave an orphaned file behind
unlink($targetFs);
error_log("PawnZM insert failed: " . $stmt->error);
$stmt->close();
$conn->close();
respond(false, "Could not save your listing. Please try again.", 500);
