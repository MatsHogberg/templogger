<?php
    require "secrets.php";

    $myObj = new \stdClass();
    $myObj->result = "";
    $myObj->dbResult = "";
    if(isset($_GET['key']) && $_GET['key'] == $apiKey)
    {
        $location = $_GET['loc'];
        $temp = $_GET['temp'];

        $myObj->temp=$temp;
        $myObj->location = $location;

        $db = openDb($dbConnection, $dbUser, $dbPassword, $database);
        $r = insert($db, $temp, $location);
        mysqli_close($db);
        $myObj->result ="OK";
        $myObj->dbResult = $r;

    }else{
        $myObj->result="Error in key";
    }

    echo json_encode($myObj);

    function insert($db, $t, $l){
        $sql ="INSERT INTO temperature(temp, location) VALUES($t, '$l')";
        $result = mysqli_query($db, $sql);
        if(!$result){
            return $sql;
        }
        return $result;
    }
    function openDb($dbConnection, $dbUser, $dbPassword, $database){
        $connection = mysqli_connect("$dbConnection", "$dbUser", "$dbPassword", "$database");
        return $connection;
    }
?>