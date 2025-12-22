# Setup and Run Script for Ecci-ulya Project

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Ecci-ulya Project Setup" -ForegroundColor Cyan
Write-Host "  Interactive Data Storytelling" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm $npmVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ npm is not installed. Please install Node.js which includes npm." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

# Install dependencies
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Ask user if they want to start the dev server
    $response = Read-Host "Would you like to start the development server now? (Y/n)"
    
    if ($response -eq "" -or $response -eq "Y" -or $response -eq "y") {
        Write-Host ""
        Write-Host "Starting development server..." -ForegroundColor Yellow
        Write-Host "The app will open at http://localhost:5173" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
        Write-Host ""
        
        npm run dev
    } else {
        Write-Host ""
        Write-Host "Setup complete! To start the development server later, run:" -ForegroundColor Green
        Write-Host "  npm run dev" -ForegroundColor Cyan
        Write-Host ""
    }
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    Write-Host "Please check the error messages above and try again" -ForegroundColor Yellow
    exit 1
}
