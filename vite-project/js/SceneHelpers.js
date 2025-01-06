import {THREE} from "./LibImports.js";

let rainTimer = new THREE.Vector2(0.0, 0.0);

function createBox(width, height, depth, pos, color, textureFiles) {

    let material;
    if (textureFiles === undefined) {
        material = new THREE.MeshStandardMaterial({color: color});
    } else {
        let textures = [];
        for (let i = 0; i < textureFiles.length; i++) {
            textures.push( new THREE.TextureLoader().load(textureFiles[i]));
            textures[i].wrapS = THREE.RepeatWrapping;
            textures[i].wrapT = THREE.RepeatWrapping;

            textures[i].repeat.set(width, depth);
        }

        material = new THREE.MeshStandardMaterial({
            map: textures[0],
            bumpMap: textures[1],
            bumpScale: 1.3,
            color: color,
            transparent: true,
        });

    }

    let mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width,height,depth, 1, 1, 1),
        material
    );

    loadRainShader(material, width, height);

    mesh.position.copy(pos);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    return mesh;
}

function loadRainShader(material, width, height) {
    //rain puddle shader
    material.onBeforeCompile = (shader) => {
        shader.uniforms.iTime = { value: rainTimer };
        shader.uniforms.iUVRes = {value: new THREE.Vector2(width, height) };

        material.userData.shaderUniforms = shader.uniforms;

        shader.vertexShader = shader.vertexShader.replace('#include <common>',
            `
                #include <common>
                varying vec2 f_uv;
                `
        );

        shader.vertexShader = shader.vertexShader.replace(
            '}',
            `
                f_uv = uv;
                }
                `
        );

        shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
            `
                #include <common>
                uniform vec2 iTime;
                uniform vec2 iUVRes;
                varying vec2 f_uv;
                
                float random (vec2 st) {
                    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
                }
                
                void drawPuddle(vec2 pos, float rInner, float rOuter) {
                    float dist = length( f_uv - pos);
                    float smoothing = smoothstep(0.0, rOuter + 0.05, rOuter + 0.05 - dist);
                    if (dist <= rInner) {
                        gl_FragColor += vec4(0.52, 0.52, 0.52, 0.0) * smoothing;
                        gl_FragColor.a = 1.0 - mod(iTime.x, 1.);
                    } else if (dist <= rOuter){
                        gl_FragColor += vec4(0.5, 0.5, 0.5, 0.0) * smoothing;
                        gl_FragColor.a = 1.0 - mod(iTime.x, 1.);
                    }
                }
                
                void drawPuddles(){
                    if (iTime.x <= 1.) return;
                    for (float j = 1.; j < 10.; j++) {
                        for (float i = 1.; i < 10. ; i++) {
                            vec2 pos = vec2(j/10., i/10.);
                            float randomMult = clamp(1.5, 2., 1.+random(pos));
                            float rInner = 0.05 * mod(iTime.x* randomMult, 1.) ;
                            float rOuter = 0.075 * mod(iTime.x* randomMult, 1.) ;
                            
                            drawPuddle(pos, rInner, rOuter);
                        }
                    }   
                }
                `
        );

        shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>',
            `
                    #include <dithering_fragment>
                    
                    drawPuddles();
                    
                  
                    `
        );};
}

export {createBox, rainTimer};