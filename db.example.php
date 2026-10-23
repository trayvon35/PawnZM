<?php
// Copy this file to db.php and fill in your own credentials.
// db.php is listed in .gitignore and must never be committed.
$host = "localhost";
$user = "your_mysql_user";
$pass = "your_mysql_password";
$dbname = "pawnzm_db";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Database Connection Failed: " . $conn->connect_error]));
}
?>
