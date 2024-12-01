import * as THREE from "three"; //import satırının kalkması gerekebilir TextureMaps classının görünmesi için
/*
* Örnek kullanım:
* const textureMaps = new TextureMaps("./resources/textures/brickwall.png"); //texture dosyası input olarak verilir
    const material = new THREE.MeshPhongMaterial({ //oluşturulan mapler MeshPongMaterial'da kullanılır.
      map: textureMaps.albedoMap,
      bumpMap: textureMaps.bumpMap,
      bumpScale:1,
      displacementMap: textureMaps.displacementMap,
      displacementScale:1,
      displacementBias:-1
    });


    const geometry = new THREE.BoxGeometry(1, 1, 1,
        512,512, 512);

    const plane = new THREE.Mesh(geometry, material);
    plane.position.z = -2;


    const light = new THREE.PointLight(0xFFFFFF, 2);
    light.position.set(1, 0, -1);



    this.scene.add(plane);
    this.scene.add(light);
*
* */
class TextureMaps {
    constructor(path) {
        this.albedoMap = new THREE.TextureLoader().load(path);

        this.displacementMap = new THREE.TextureLoader().load(path,
            (tex) => {this.modifyTexture(tex, convertToDisplacementMapPixel)});
        this.bumpMap = new THREE.TextureLoader().load(path,
            (tex) => {this.modifyTexture(tex, convertToBumpMapPixel)});

        function convertToBumpMapPixel(imageData, i) {

            let rgba = {
                r:imageData.data[i],
                g:imageData.data[i+1],
                b:imageData.data[i+2],
                a:imageData.data[i+3]
            }

            rgba = adjustSaturationRGBA(rgba, -100);
            invertRGBA(rgba);
            adjustBrightnessAndContrast(rgba, 50, 1.2);

            imageData.data[i] = rgba.r;
            imageData.data[i+1] = rgba.g;
            imageData.data[i+2] = rgba.b;
            imageData.data[i+3] = rgba.a;

        }

        function convertToDisplacementMapPixel(imageData, i) {
            let rgba = {
                r:imageData.data[i],
                g:imageData.data[i+1],
                b:imageData.data[i+2],
                a:imageData.data[i+3]
            }

            rgba = adjustSaturationRGBA(rgba, -100);
            adjustBrightnessAndContrast(rgba, 100, 2);

            imageData.data[i] = rgba.r;
            imageData.data[i+1] = rgba.g;
            imageData.data[i+2] = rgba.b;
            imageData.data[i+3] = rgba.a;
        }

    }

    modifyTexture(texture, modificationFunction) {
        const width = texture.image.width;
        const height = texture.image.height;

        const ctx = document.createElement('canvas').getContext('2d');
        const canvas = ctx.canvas;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(texture.image, 0, 0);
        const imgData = ctx.getImageData(0, 0, width, height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4; // RGBA index
                modificationFunction(imgData, i);
            }
        }

        ctx.putImageData(imgData, 0, 0);

        texture.image = canvas;
        texture.needsUpdate = true;

    }

}