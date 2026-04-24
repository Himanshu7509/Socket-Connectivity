# Redis Quick Start Script for Windows
# Run this in PowerShell to quickly set up Redis using Docker

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Redis Setup for ChatApp" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
$dockerVersion = docker --version 2>$null

if ($dockerVersion) {
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
    Write-Host ""
    
    # Check if Redis container already exists
    $containerExists = docker ps -a --filter "name=chatapp-redis" --format "{{.Names}}" 2>$null
    
    if ($containerExists -eq "chatapp-redis") {
        Write-Host "Redis container already exists." -ForegroundColor Yellow
        $containerRunning = docker ps --filter "name=chatapp-redis" --format "{{.Names}}" 2>$null
        
        if ($containerRunning -eq "chatapp-redis") {
            Write-Host "✓ Redis is already running!" -ForegroundColor Green
        } else {
            Write-Host "Starting Redis container..." -ForegroundColor Yellow
            docker start chatapp-redis
            Write-Host "✓ Redis started!" -ForegroundColor Green
        }
    } else {
        Write-Host "Creating new Redis container..." -ForegroundColor Yellow
        docker run -d -p 6379:6379 --name chatapp-redis redis:latest
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Redis container created and running!" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to create Redis container" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host ""
    Write-Host "Testing Redis connection..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    
    # Test Redis connection
    $pingResult = docker exec chatapp-redis redis-cli ping 2>$null
    
    if ($pingResult -eq "PONG") {
        Write-Host "✓ Redis is running and responding!" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  Redis is ready to use!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Start your backend: cd server && npm run dev" -ForegroundColor White
        Write-Host "2. Start your frontend: cd client/chat-app && npm run dev" -ForegroundColor White
        Write-Host ""
        Write-Host "Useful commands:" -ForegroundColor Yellow
        Write-Host "- Stop Redis: docker stop chatapp-redis" -ForegroundColor White
        Write-Host "- Start Redis: docker start chatapp-redis" -ForegroundColor White
        Write-Host "- View logs: docker logs chatapp-redis" -ForegroundColor White
        Write-Host "- Redis CLI: docker exec -it chatapp-redis redis-cli" -ForegroundColor White
    } else {
        Write-Host "✗ Redis is not responding properly" -ForegroundColor Red
        Write-Host "Container logs:" -ForegroundColor Yellow
        docker logs chatapp-redis
    }
} else {
    Write-Host "✗ Docker is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Docker Desktop:" -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop/" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternative: Install Redis directly" -ForegroundColor Yellow
    Write-Host "Using Chocolatey: choco install redis-64" -ForegroundColor White
    Write-Host "Or use Redis Cloud: https://redis.com/try-free/" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
