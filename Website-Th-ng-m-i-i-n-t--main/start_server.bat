@echo off
title May Chu Localhost Kinh Xanh
color 0A

:: Doi sang thu muc chua file .bat nay (root du an)
cd /d "%~dp0"

:: Kiem tra xem PHP da duoc them vao PATH chua
php -v >nul 2>&1
if "%ERRORLEVEL%" == "0" (
    set PHP_CMD=php
    goto :RunServer
)

:: Kiem tra tiep neu xai XAMPP o thu muc mac dinh o o C
if exist "C:\xampp\php\php.exe" (
    set "PHP_CMD=C:\xampp\php\php.exe"
    goto :RunServer
)

:: Neu hoan toan chua cai gi
color 0C
echo ==========================================================
echo [LOI]: MAY TINH CHUA CAI DAT PHP HOAC XAMPP !
echo ==========================================================
echo Ban chua cai dat moi truong de bam chay trang nay.
echo 1. Hay cai dat phan mem XAMPP tren Windows.
echo 2. Hoac ban hay copy toan bo thu muc nay bo vao "C:\xampp\htdocs\kinhxanh\"
echo 3. Roi mo XAMPP len nhan "Start" o cho Apache va MySQL.
echo 4. Sau do len trinh duyet go http://localhost/kinhxanh/
echo ==========================================================
pause
exit /b

:RunServer
echo ==========================================================
echo           KINH XANH OPTICAL - PHP LOCAL SERVER
echo ==========================================================
echo.
echo Phat hien trinh chay boi: %PHP_CMD%
echo Thu muc goc: %~dp0
echo Dang mo website o may chu noi bo...
echo - Trang truy cap: http://localhost:8000
echo - Backend API  : http://localhost:8000/backend/api/
echo - De tat server nhan dong thoi 2 phim [Ctrl + C]
echo ==========================================================
echo.

start http://localhost:8000

:: -S: dia chi server | -t: thu muc goc chua index.html (chinh la thu muc nay)
"%PHP_CMD%" -S 127.0.0.1:8000 -t "%~dp0"

pause
