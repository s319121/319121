/**
 * GeeksCase - 全站核心 JavaScript
 * 包含：基礎介面邏輯、配件接接樂小遊戲引擎
 */

// ==========================================
// 1. 全域變數與初始化
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("GeeksCase 系統啟動...");
    
    // 如果畫面上存在遊戲畫布，則啟動遊戲邏輯
    if (document.getElementById('gameCanvas')) {
        initCatchGame();
    }
});

// ==========================================
// 2. 接配件小遊戲引擎 (Catch The Accessories)
// ==========================================

function initCatchGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('game-canvas-container');
    const scoreElement = document.getElementById('game-score');
    const livesElement = document.getElementById('game-lives');
    const finalScoreElement = document.getElementById('final-score');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const gameStartOverlay = document.getElementById('game-start-overlay');
    const rewardMsg = document.getElementById('reward-msg');

    // 遊戲參數
    let score = 0;
    let lives = 3;
    let isGameRunning = false;
    let animationId;
    let items = [];
    let spawnTimer = 0;
    let speedMultiplier = 1;

    // 圖片資源 (對應 images 資料夾)
    const itemImages = [
        'images/手機殼.jpg',
        'images/充電器.jpg',
        'images/行動電源.jpg',
        'images/磁吸支架.jpg',
        'images/散熱器.jpg'
    ];

    // 載入圖片物件
    const loadedImages = [];
    itemImages.forEach(src => {
        const img = new Image();
        img.src = src;
        loadedImages.push(img);
    });

    // 購物籃物件
    const basket = {
        w: 100,
        h: 60,
        x: 0,
        y: 0,
        color: '#f97316' // GeeksCase 品牌橘
    };

    // 初始化畫布尺寸
    function resizeCanvas() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        basket.y = canvas.height - basket.h - 10;
        basket.x = canvas.width / 2 - basket.w / 2;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 滑鼠/觸控移動監聽
    container.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const root = document.documentElement;
        let mouseX = e.clientX - rect.left - root.scrollLeft;
        
        // 限制籃子不超出邊界
        basket.x = mouseX - basket.w / 2;
        if (basket.x < 0) basket.x = 0;
        if (basket.x > canvas.width - basket.w) basket.x = canvas.width - basket.w;
    });

    // 觸控支援
    container.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        let touchX = touch.clientX - rect.left;
        basket.x = touchX - basket.w / 2;
        if (basket.x < 0) basket.x = 0;
        if (basket.x > canvas.width - basket.w) basket.x = canvas.width - basket.w;
    }, { passive: false });

    // 開始遊戲
    window.startGame = function() {
        score = 0;
        lives = 3;
        items = [];
        speedMultiplier = 1;
        isGameRunning = true;
        gameStartOverlay.style.display = 'none';
        gameOverOverlay.style.display = 'none';
        updateUI();
        gameLoop();
    };

    // 重置遊戲
    window.resetGame = function() {
        cancelAnimationFrame(animationId);
        startGame();
    };

    // 產生掉落配件
    function createItem() {
        const randomIndex = Math.floor(Math.random() * loadedImages.length);
        const itemSize = 50;
        items.push({
            img: loadedImages[randomIndex],
            x: Math.random() * (canvas.width - itemSize),
            y: -itemSize,
            size: itemSize,
            speed: (Math.random() * 2 + 2) * speedMultiplier
        });
    }

    // 更新介面
    function updateUI() {
        scoreElement.innerText = score;
        livesElement.innerText = '❤'.repeat(lives);
    }

    // 遊戲主迴圈
    function gameLoop() {
        if (!isGameRunning) return;

        // 1. 清除畫布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. 繪製籃子
        ctx.fillStyle = basket.color;
        // 繪製圓角矩形籃子
        ctx.beginPath();
        ctx.roundRect(basket.x, basket.y, basket.w, basket.h, 10);
        ctx.fill();
        // 籃子標籤
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GeeksCase", basket.x + basket.w/2, basket.y + basket.h/2 + 5);

        // 3. 處理配件掉落
        spawnTimer++;
        if (spawnTimer > 60 / speedMultiplier) {
            createItem();
            spawnTimer = 0;
        }

        for (let i = items.length - 1; i >= 0; i--) {
            let it = items[i];
            it.y += it.speed;

            // 繪製配件圖片
            ctx.drawImage(it.img, it.x, it.y, it.size, it.size);

            // 碰撞偵測 (接住)
            if (
                it.y + it.size > basket.y &&
                it.x + it.size > basket.x &&
                it.x < basket.x + basket.w
            ) {
                items.splice(i, 1);
                score += 10;
                // 每 100 分增加難度
                if (score % 100 === 0) speedMultiplier += 0.2;
                updateUI();
                continue;
            }

            // 漏接偵測 (到底部)
            if (it.y > canvas.height) {
                items.splice(i, 1);
                lives--;
                updateUI();
                if (lives <= 0) endGame();
            }
        }

        animationId = requestAnimationFrame(gameLoop);
    }

    // 結束遊戲
    function endGame() {
        isGameRunning = false;
        cancelAnimationFrame(animationId);
        gameOverOverlay.style.display = 'flex';
        finalScoreElement.innerText = score;

        if (score >= 150) {
            rewardMsg.innerHTML = `<div class="alert alert-success">恭喜！解鎖折扣碼：<br><b class="fs-3">GCPLAY99</b><br>全館 9 折優惠！</div>`;
        } else {
            rewardMsg.innerHTML = `<p class="text-white-50">差一點點！滿 150 分就有折扣碼喔，再試一次吧！</p>`;
        }
    }
}