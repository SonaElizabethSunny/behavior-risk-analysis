@echo off
echo ========================================
echo   ASSAULT DETECTION ALERT SETUP
echo ========================================
echo.
echo This script will help you configure email and SMS alerts.
echo.
echo IMPORTANT: Without proper configuration, the system will still
echo detect assaults and show them in dashboards, but will NOT send
echo email/SMS notifications automatically.
echo.
pause

cd /d "%~dp0ml_service"

echo.
echo ========================================
echo   STEP 1: Choose Email Provider
echo ========================================
echo.
echo 1. SendGrid (Recommended - 100 free emails/day)
echo 2. Gmail SMTP (Requires App Password)
echo 3. Skip email setup
echo.
set /p email_choice="Enter your choice (1-3): "

if "%email_choice%"=="1" (
    echo.
    echo ========================================
    echo   SENDGRID SETUP
    echo ========================================
    echo.
    echo Please complete these steps:
    echo 1. Go to: https://sendgrid.com
    echo 2. Sign up for free account
    echo 3. Verify your sender email address
    echo 4. Create API Key with "Mail Send" permission
    echo.
    echo After completing the above steps, enter your details:
    echo.
    
    set /p sg_sender="Enter your verified sender email: "
    set /p sg_apikey="Enter your SendGrid API Key (starts with SG.): "
    set /p sg_receiver="Enter police/alert receiver email: "
    
    echo.
    echo Configuring SendGrid...
    (
        echo # Email Configuration - SendGrid
        echo USE_SENDGRID=true
        echo EMAIL_SENDER=%sg_sender%
        echo EMAIL_PASSWORD=%sg_apikey%
        echo EMAIL_RECEIVER=%sg_receiver%
        echo.
        echo # Twilio SMS Configuration ^(Optional^)
        echo TWILIO_SID=your_twilio_sid
        echo TWILIO_AUTH_TOKEN=your_twilio_auth_token
        echo TWILIO_PHONE=+1234567890
        echo ADMIN_PHONE=+1234567890
    ) > .env
    
    echo ✅ SendGrid configured successfully!
)

if "%email_choice%"=="2" (
    echo.
    echo ========================================
    echo   GMAIL SMTP SETUP
    echo ========================================
    echo.
    echo Please complete these steps:
    echo 1. Enable 2-Factor Auth on your Google account
    echo 2. Go to: https://myaccount.google.com/apppasswords
    echo 3. Create an App Password for "Mail"
    echo.
    echo After completing the above steps, enter your details:
    echo.
    
    set /p gmail_sender="Enter your Gmail address: "
    set /p gmail_password="Enter your 16-character App Password: "
    set /p gmail_receiver="Enter police/alert receiver email: "
    
    echo.
    echo Configuring Gmail...
    (
        echo # Email Configuration - Gmail
        echo USE_SENDGRID=false
        echo EMAIL_SENDER=%gmail_sender%
        echo EMAIL_PASSWORD=%gmail_password%
        echo EMAIL_RECEIVER=%gmail_receiver%
        echo.
        echo # Twilio SMS Configuration ^(Optional^)
        echo TWILIO_SID=your_twilio_sid
        echo TWILIO_AUTH_TOKEN=your_twilio_auth_token
        echo TWILIO_PHONE=+1234567890
        echo ADMIN_PHONE=+1234567890
    ) > .env
    
    echo ✅ Gmail configured successfully!
)

if "%email_choice%"=="3" (
    echo.
    echo ⚠️ Skipping email setup. Alerts will only show in dashboard.
)

echo.
echo ========================================
echo   STEP 2: Configure SMS (Optional)
echo ========================================
echo.
set /p sms_choice="Do you want to set up SMS alerts via Twilio? (Y/N): "

if /i "%sms_choice%"=="Y" (
    echo.
    echo Please complete these steps:
    echo 1. Go to: https://www.twilio.com
    echo 2. Sign up for free trial
    echo 3. Get your Account SID and Auth Token from console
    echo 4. Get a Twilio phone number
    echo.
    pause
    echo.
    
    set /p tw_sid="Enter your Twilio Account SID: "
    set /p tw_token="Enter your Twilio Auth Token: "
    set /p tw_phone="Enter your Twilio phone number (+1234567890): "
    set /p admin_phone="Enter admin phone to receive alerts (+1987654321): "
    
    echo.
    echo Updating .env with Twilio settings...
    
    powershell -Command "(Get-Content .env) -replace 'TWILIO_SID=.*', 'TWILIO_SID=%tw_sid%' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'TWILIO_AUTH_TOKEN=.*', 'TWILIO_AUTH_TOKEN=%tw_token%' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'TWILIO_PHONE=.*', 'TWILIO_PHONE=%tw_phone%' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'ADMIN_PHONE=.*', 'ADMIN_PHONE=%admin_phone%' | Set-Content .env"
    
    echo ✅ Twilio configured successfully!
) else (
    echo.
    echo ⚠️ Skipping SMS setup. Only email alerts will be sent.
)

echo.
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo Configuration saved to: ml_service\.env
echo.
echo Next steps:
echo 1. Review your .env file if needed
echo 2. Run start_all.bat to start the system
echo 3. Test alerts with live webcam detection
echo.
echo For detailed instructions, see PERFORMANCE_FIXES.md
echo.
pause
