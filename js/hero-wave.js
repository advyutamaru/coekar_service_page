// 医療記録サービス「コエカル」専用3Dビジュアライザー
let scene, camera, renderer, composer;
let voiceWaveform, textParticles, dataFlow;
let animationId;
let time = 0;
let mouseX = 0, mouseY = 0;
let scrollProgress = 0;

// サービスコンセプトの状態管理
const serviceState = {
    voiceIntensity: 0.3,
    conversionProgress: 0,
    recordingActive: false,
    textGeneration: [],
    pulsePhase: 0
};

// 医療系カラーパレット（信頼感・清潔感）
const medicalColors = {
    primary: 0x0ea5e9,     // スカイブルー（清潔感）
    secondary: 0x0284c7,   // オーシャンブルー（信頼感）
    accent: 0x38bdf8,      // ライトブルー（技術）
    text: 0xe0f2fe,        // テキストホワイト
    pulse: 0x7dd3fc,       // パルス
    success: 0x10b981      // 成功グリーン
};

function initWaveAnimation() {
    // シーン設定
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x001220, 100, 500);

    // カメラ設定（より落ち着いた視点）
    camera = new THREE.PerspectiveCamera(
        60, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.set(0, 20, 80);
    camera.lookAt(0, 0, 0);

    // レンダラー設定
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    
    const container = document.getElementById('hero-canvas-container');
    if (container) {
        container.appendChild(renderer.domElement);
    }

    // 医療的な清潔感のあるライティング
    setupMedicalLighting();
    
    // コアビジュアル要素
    createVoiceWaveform();      // 音声波形
    createTextTransformation(); // テキスト変換
    createDataFlowSystem();     // データフロー
    createMedicalGrid();        // 背景グリッド
    
    // ユーザーインタラクション
    setupServiceInteractions();
    
    // リサイズ対応
    window.addEventListener('resize', onWindowResize);
}

function setupMedicalLighting() {
    // 明るく清潔感のある環境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // メインライト（上からの柔らかい光）
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(0, 100, 50);
    mainLight.castShadow = false; // パフォーマンス優先
    scene.add(mainLight);
    
    // フィルライト（横からの補助光）
    const fillLight = new THREE.DirectionalLight(medicalColors.accent, 0.3);
    fillLight.position.set(50, 20, 0);
    scene.add(fillLight);
}

function createVoiceWaveform() {
    // 中央の音声波形ビジュアライザー
    const waveformGroup = new THREE.Group();
    
    // 波形バーを作成（シンプルで見やすいデザイン）
    const barCount = 64;
    const barWidth = 1.5;
    const barSpacing = 2;
    
    for (let i = 0; i < barCount; i++) {
        const geometry = new THREE.BoxGeometry(barWidth, 1, barWidth);
        const material = new THREE.MeshPhongMaterial({
            color: medicalColors.primary,
            emissive: medicalColors.secondary,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.9
        });
        
        const bar = new THREE.Mesh(geometry, material);
        bar.position.x = (i - barCount / 2) * barSpacing;
        bar.position.y = 0;
        bar.userData = {
            index: i,
            baseHeight: 1,
            frequency: Math.random() * 0.03 + 0.01
        };
        
        waveformGroup.add(bar);
    }
    
    waveformGroup.position.y = -10;
    voiceWaveform = waveformGroup;
    scene.add(waveformGroup);
    
    // 音声入力インジケーター
    createVoiceIndicator();
}

function createVoiceIndicator() {
    // マイクアイコンの3D表現
    const micGroup = new THREE.Group();
    
    // マイク本体
    const micGeometry = new THREE.CylinderGeometry(2, 2, 6, 16);
    const micMaterial = new THREE.MeshPhongMaterial({
        color: medicalColors.accent,
        emissive: medicalColors.pulse,
        emissiveIntensity: 0.2
    });
    const mic = new THREE.Mesh(micGeometry, micMaterial);
    micGroup.add(mic);
    
    // パルスリング（録音中を表現）
    for (let i = 0; i < 3; i++) {
        const ringGeometry = new THREE.RingGeometry(4 + i * 2, 5 + i * 2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: medicalColors.pulse,
            transparent: true,
            opacity: 0.3 - i * 0.1,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.userData.ringIndex = i;
        micGroup.add(ring);
    }
    
    micGroup.position.set(-60, 0, 0);
    scene.add(micGroup);
}

function createTextTransformation() {
    // テキスト変換パーティクルシステム
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // 文字のようなパーティクル配置
    for (let i = 0; i < particleCount; i++) {
        // 右側に配置（変換後のテキストエリア）
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 20 + Math.random() * 30;
        
        positions[i * 3] = 60 + Math.cos(angle) * radius * 0.5;
        positions[i * 3 + 1] = Math.sin(angle) * radius * 0.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        
        // テキストカラー（白っぽい）
        colors[i * 3] = 0.88;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 0.99;
        
        sizes[i] = Math.random() * 2 + 1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // テキストパーティクルマテリアル
    const material = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    textParticles = new THREE.Points(geometry, material);
    scene.add(textParticles);
    
    // 変換矢印
    createTransformArrow();
}

function createTransformArrow() {
    // 音声→テキストの変換を示す矢印
    const arrowGroup = new THREE.Group();
    
    // 矢印のシャフト
    const shaftGeometry = new THREE.BoxGeometry(30, 0.5, 0.5);
    const shaftMaterial = new THREE.MeshPhongMaterial({
        color: medicalColors.success,
        emissive: medicalColors.success,
        emissiveIntensity: 0.3
    });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    arrowGroup.add(shaft);
    
    // 矢印の先端
    const headGeometry = new THREE.ConeGeometry(2, 4, 8);
    const headMaterial = new THREE.MeshPhongMaterial({
        color: medicalColors.success,
        emissive: medicalColors.success,
        emissiveIntensity: 0.3
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.rotation.z = -Math.PI / 2;
    head.position.x = 17;
    arrowGroup.add(head);
    
    arrowGroup.position.set(0, 0, 0);
    scene.add(arrowGroup);
}

function createDataFlowSystem() {
    // データフローのビジュアライゼーション
    const flowGroup = new THREE.Group();
    
    // フローライン（音声データの流れ）
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-60, 0, 0),
        new THREE.Vector3(-30, 10, 0),
        new THREE.Vector3(0, 5, 0),
        new THREE.Vector3(30, 10, 0),
        new THREE.Vector3(60, 0, 0)
    ]);
    
    const points = curve.getPoints(100);
    const flowGeometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const flowMaterial = new THREE.LineBasicMaterial({
        color: medicalColors.accent,
        transparent: true,
        opacity: 0.3,
        linewidth: 2
    });
    
    const flowLine = new THREE.Line(flowGeometry, flowMaterial);
    flowGroup.add(flowLine);
    
    // データパケット（動くドット）
    for (let i = 0; i < 10; i++) {
        const dotGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        const dotMaterial = new THREE.MeshPhongMaterial({
            color: medicalColors.pulse,
            emissive: medicalColors.pulse,
            emissiveIntensity: 0.5
        });
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        dot.userData = {
            progress: i * 0.1,
            curve: curve
        };
        flowGroup.add(dot);
    }
    
    dataFlow = flowGroup;
    scene.add(flowGroup);
}

function createMedicalGrid() {
    // 背景の医療的グリッド（清潔感のある背景）
    const gridHelper = new THREE.GridHelper(200, 40, 0x0891b2, 0x0c4a6e);
    gridHelper.position.y = -20;
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
    
    // 垂直グリッド（データ感を演出）
    const verticalGrid = gridHelper.clone();
    verticalGrid.rotation.x = Math.PI / 2;
    verticalGrid.position.z = -50;
    verticalGrid.position.y = 0;
    scene.add(verticalGrid);
}

function setupServiceInteractions() {
    // マウス移動（控えめな反応）
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    });
    
    // スクロール（パララックス効果）
    window.addEventListener('scroll', () => {
        scrollProgress = window.scrollY / window.innerHeight;
    });
    
    // CTAボタンとの連携
    const ctaButton = document.querySelector('.hero-cta');
    if (ctaButton) {
        ctaButton.addEventListener('mouseenter', () => {
            serviceState.recordingActive = true;
            serviceState.voiceIntensity = 0.8;
        });
        
        ctaButton.addEventListener('mouseleave', () => {
            serviceState.recordingActive = false;
            serviceState.voiceIntensity = 0.3;
        });
        
        ctaButton.addEventListener('click', (e) => {
            e.preventDefault();
            triggerConversionAnimation();
        });
    }
}

function triggerConversionAnimation() {
    // 音声→テキスト変換のデモアニメーション
    serviceState.conversionProgress = 0;
    
    const conversionInterval = setInterval(() => {
        serviceState.conversionProgress += 0.02;
        
        if (serviceState.conversionProgress >= 1) {
            serviceState.conversionProgress = 0;
            clearInterval(conversionInterval);
            
            // 成功フィードバック
            showSuccessAnimation();
        }
    }, 50);
}

function showSuccessAnimation() {
    // 変換成功のビジュアルフィードバック
    const successGroup = new THREE.Group();
    
    // チェックマーク
    const checkShape = new THREE.Shape();
    checkShape.moveTo(-5, 0);
    checkShape.lineTo(-2, -3);
    checkShape.lineTo(5, 4);
    
    const checkGeometry = new THREE.ShapeGeometry(checkShape);
    const checkMaterial = new THREE.MeshBasicMaterial({
        color: medicalColors.success,
        transparent: true,
        opacity: 0.9
    });
    const checkMark = new THREE.Mesh(checkGeometry, checkMaterial);
    checkMark.position.set(60, 10, 0);
    successGroup.add(checkMark);
    
    scene.add(successGroup);
    
    // フェードアウト
    setTimeout(() => {
        scene.remove(successGroup);
    }, 2000);
}

function updateAnimation() {
    time++;
    
    // 音声波形の更新
    updateVoiceWaveform();
    
    // テキストパーティクルの更新
    updateTextParticles();
    
    // データフローの更新
    updateDataFlow();
    
    // マイクインジケーターの更新
    updateMicIndicator();
    
    // カメラの微細な動き
    updateCamera();
}

function updateVoiceWaveform() {
    if (!voiceWaveform) return;
    
    voiceWaveform.children.forEach((bar, index) => {
        const userData = bar.userData;
        
        // 音声シミュレーション
        const audioWave = Math.sin(time * userData.frequency + index * 0.1) * 
                         serviceState.voiceIntensity * 10;
        const randomNoise = Math.random() * 2 - 1;
        
        // 高さの更新
        const targetHeight = Math.abs(audioWave + randomNoise) + userData.baseHeight;
        bar.scale.y = targetHeight;
        bar.position.y = targetHeight / 2;
        
        // 録音中は色を変更
        if (serviceState.recordingActive) {
            bar.material.color.setHex(medicalColors.success);
            bar.material.emissiveIntensity = 0.3;
        } else {
            bar.material.color.setHex(medicalColors.primary);
            bar.material.emissiveIntensity = 0.1;
        }
    });
}

function updateTextParticles() {
    if (!textParticles) return;
    
    const positions = textParticles.geometry.attributes.position.array;
    const particleCount = positions.length / 3;
    
    for (let i = 0; i < particleCount; i++) {
        const index = i * 3;
        
        // テキスト生成アニメーション
        if (serviceState.conversionProgress > 0) {
            const progress = Math.min(1, serviceState.conversionProgress * 2 - i / particleCount);
            
            if (progress > 0) {
                // 文字が形成される動き
                positions[index + 1] += Math.sin(time * 0.02 + i) * 0.1;
                
                // 整列アニメーション
                const targetX = 60 + (i % 20) * 2;
                const targetY = Math.floor(i / 20) * 2 - 10;
                
                positions[index] += (targetX - positions[index]) * progress * 0.1;
                positions[index + 1] += (targetY - positions[index + 1]) * progress * 0.1;
            }
        } else {
            // アイドル時の浮遊
            positions[index + 1] += Math.sin(time * 0.01 + i * 0.1) * 0.05;
        }
    }
    
    textParticles.geometry.attributes.position.needsUpdate = true;
    
    // 全体の回転
    textParticles.rotation.y = Math.sin(time * 0.0005) * 0.1;
}

function updateDataFlow() {
    if (!dataFlow) return;
    
    dataFlow.children.forEach((child) => {
        if (child.userData.curve) {
            // データパケットの移動
            child.userData.progress += 0.005;
            if (child.userData.progress > 1) {
                child.userData.progress = 0;
            }
            
            const position = child.userData.curve.getPoint(child.userData.progress);
            child.position.copy(position);
            
            // パルス効果
            const scale = 1 + Math.sin(time * 0.05 + child.userData.progress * Math.PI * 2) * 0.3;
            child.scale.set(scale, scale, scale);
        }
    });
}

function updateMicIndicator() {
    scene.traverse((object) => {
        if (object.userData.ringIndex !== undefined) {
            // パルスリングのアニメーション
            const index = object.userData.ringIndex;
            const scale = 1 + Math.sin(time * 0.02 + index * 0.5) * 0.2 * serviceState.voiceIntensity;
            object.scale.set(scale, scale, 1);
            object.material.opacity = (0.3 - index * 0.1) * serviceState.voiceIntensity;
        }
    });
}

function updateCamera() {
    // 穏やかなカメラ移動
    camera.position.x = Math.sin(time * 0.0001) * 10 + mouseX * 5;
    camera.position.y = 20 + Math.cos(time * 0.0002) * 5 + mouseY * 2;
    camera.position.z = 80 - scrollProgress * 20;
    
    camera.lookAt(0, 0, 0);
}

function animate() {
    animationId = requestAnimationFrame(animate);
    
    updateAnimation();
    
    // 低負荷でスムーズなレンダリング
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// パフォーマンス最適化
function optimizePerformance() {
    // モバイルデバイスの検出
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // モバイルでは簡略化
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled = false;
    }
    
    // 低スペックデバイス対応
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // アニメーションを最小限に
        serviceState.voiceIntensity = 0.1;
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initWaveAnimation();
    optimizePerformance();
    animate();
});