@echo off
setlocal
color 0B
echo =======================================================
echo      CAI DAT MOI TRUONG MONGODB CHO DU AN KINH XANH
echo =======================================================
echo.

set "PHP_DIR=C:\xampp\php"
set "EXT_DIR=C:\xampp\php\ext"
set "PHP_INI=C:\xampp\php\php.ini"

if not exist "%PHP_DIR%\php.exe" (
    color 0C
    echo [LOI] Khong tim thay PHP tai %PHP_DIR%. 
    echo Vui long dam bao XAMPP duoc cai dat o o C:.
    pause
    exit /b
)

echo Thay XAMPP PHP tai %PHP_DIR%.
echo Dang kiem tra Extension MongoDB...
"%PHP_DIR%\php.exe" -m | findstr -i "mongo" >nul
if "%ERRORLEVEL%"=="0" (
    echo [+] MongoDB Extension dang hoat dong!
) else (
    echo [-] Chua cai dat MongoDB Extension. Dang tai ban fix cho PHP 8.0...
    powershell -Command "Invoke-WebRequest -Uri 'https://windows.php.net/downloads/pecl/releases/mongodb/1.17.2/php_mongodb-1.17.2-8.0-ts-vs16-x64.zip' -OutFile 'mongodb_ext.zip'"
    if not exist "mongodb_ext.zip" (
        echo [LOI] Khong tai duoc file. Vui long kiem tra mang.
        pause
        exit /b
    )
    echo Dang giai nen file...
    powershell -Command "Expand-Archive -Path 'mongodb_ext.zip' -DestinationPath 'mongodb_ext_tmp' -Force"
    
    echo Dang cai dat vao C:\xampp\php\ext...
    copy /Y "mongodb_ext_tmp\php_mongodb.dll" "%EXT_DIR%\"
    echo extension=mongodb >> "%PHP_INI%"
    
    echo Dang xoa file rac...
    rmdir /S /Q mongodb_ext_tmp
    del mongodb_ext.zip
    echo [+] Da bat extension mongodb xong!
)

echo.
echo =======================================================
echo      CAI DAT THU VIEN COMPOSER (BACKEND)
echo =======================================================
cd /d "%~dp0backend"

if not exist "composer.phar" (
    echo [-] Khong co san Composer. Dang tai ve may...
    powershell -Command "Invoke-WebRequest -Uri 'https://getcomposer.org/download/latest-stable/composer.phar' -OutFile 'composer.phar'"
)

echo [+] Dang tien hanh cai dat thu vien MongoDB (mong cho xiu nhe)...
"%PHP_DIR%\php.exe" composer.phar install --ignore-platform-reqs

echo.
echo =======================================================
echo      TIEN HANH SEED DU LIEU MAU VAO MONGODB
echo =======================================================
cd /d "%~dp0"
"%PHP_DIR%\php.exe" database\seed_mongo.php

echo.
echo =======================================================
echo HOAN TAT TAT CA! 
echo Ban co the tat cua so nay va chay file start_server.bat 
echo de mo website va bat dau tan huong MongoDB nhe.
echo =======================================================
pause
