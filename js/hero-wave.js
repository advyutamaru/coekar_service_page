// 3D音声ウェーブアニメーション
let scene, camera, renderer;
let analyser, dataArray;
let animationId;
let time = 0;
let colorMode = 0;
let waveformMode = 0;
let isPlaying = true;
let particles;
let particlePositions;

// コエカルブランドカラースキーム
const colorSchemes = [
    { primary: 0x1e3a8a, secondary: 0x3b82f6, accent: 0x3b82f6 }, // ブルー系（メイン）
    { primary: 0x7c3aed, secondary: 0xa78bfa, accent: 0x8b5cf6 }, // パープル系
    { primary: 0x0891b2, secondary: 0x06b6d4, accent: 0x0ea5e9 }, // シアン系
    { primary: 0x059669, secondary: 0x10b981, accent: 0x10b981 }  // グリーン系
];

function initWaveAnimation() {
    // シーン設定
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000515, 100, 500);

    // カメラ設定
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.set(0, 30, 100);
    camera.lookAt(0, 0, 0);

    // レンダラー設定
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    
    const container = document.getElementById('hero-canvas-container');
    if (container) {
        container.appendChild(renderer.domElement);
    }

    // ライティング
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(0, 50, 50);
    scene.add(directionalLight);

    // パーティクル作成
    createParticles();
    initAudioSimulation();

    // リサイズハンドラー
    window.addEventListener('resize', onWindowResize);
}

function createParticles() {
    const particleCount = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 250;
        const y = Math.random() * 60 - 30;
        const z = (Math.random() - 0.5) * 250;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 円形のテクスチャを作成
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // グラデーション付きの円を描画
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
        color: colorSchemes[colorMode].accent,
        size: 3,
        map: texture,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function initAudioSimulation() {
    // 音声データのシミュレーション
    dataArray = new Float32Array(128);
    for (let i = 0; i < dataArray.length; i++) {
        dataArray[i] = Math.random() * 128;
    }
}

function updateParticles() {
    const positions = particles.geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 3) {
        const originalY = particlePositions[i + 1];
        positions[i + 1] = originalY + Math.sin(time * 0.0008 + i) * 1.5;
        
        // 中心周りの回転
        const x = particlePositions[i];
        const z = particlePositions[i + 2];
        const angle = time * 0.00015;
        positions[i] = x * Math.cos(angle) - z * Math.sin(angle);
        positions[i + 2] = x * Math.sin(angle) + z * Math.cos(angle);
    }
    
    particles.geometry.attributes.position.needsUpdate = true;
}

function animate() {
    if (!isPlaying) return;
    
    animationId = requestAnimationFrame(animate);
    time++;

    updateParticles();

    // カメラの微妙な動き
    camera.position.x = Math.sin(time * 0.0003) * 20;
    camera.position.z = 100 + Math.cos(time * 0.0003) * 15;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// コントロール関数
function toggleWaveAnimation() {
    isPlaying = !isPlaying;
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        const icon = playBtn.querySelector('svg');
        if (icon) {
            icon.setAttribute('data-feather', isPlaying ? 'pause' : 'play');
            feather.replace();
        }
        playBtn.classList.toggle('active');
    }
    
    if (isPlaying) {
        animate();
    }
}

function changeWavePattern(e) {
    waveformMode = (waveformMode + 1) % 3;
    
    // ボタンアニメーション
    const btn = e.currentTarget;
    btn.classList.add('active');
    setTimeout(() => btn.classList.remove('active'), 300);
}

function toggleColorScheme(e) {
    colorMode = (colorMode + 1) % colorSchemes.length;
    const color = colorSchemes[colorMode];
    
    // パーティクルカラー更新
    particles.material.color.set(color.accent);
    
    // ボタンアニメーション
    const btn = e.currentTarget;
    btn.classList.add('active');
    setTimeout(() => btn.classList.remove('active'), 300);
}

// ヒーローCTAボタンのインタラクション
function initHeroInteractions() {
    const ctaButton = document.querySelector('.hero-cta');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            // パーティクルパルスエフェクト
            if (particles) {
                particles.material.size = 5;
                setTimeout(() => {
                    particles.material.size = 3;
                }, 300);
            }
        });
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initWaveAnimation();
    initHeroInteractions();
    animate();
});