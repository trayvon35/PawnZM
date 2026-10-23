<?php
header("Content-Type: application/json");
require_once "db.php";

$sql = "SELECT id, title, price, category, seller, location, contact, description, image FROM products ORDER BY id DESC";
$result = $conn->query($sql);

$products = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
}

echo json_encode($products);
$conn->close();
?>
