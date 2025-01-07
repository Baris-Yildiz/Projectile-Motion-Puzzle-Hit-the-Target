const smokeFragmentShader = `
    in vec4 o_color;
    in vec2 f_uv;
    
    out vec4 f_color;
    
    uniform sampler2D smokeTexture;
    void main()
    {
        vec2 UV = f_uv;

        vec2 distVector = UV - vec2(0.5, 0.5);
        float dist = length(distVector);

        if (dist > 0.25) {
            UV.x -= distVector.x * 0.4;
            UV.y -= distVector.y * 0.4;    
        }
        
        f_color = texture(smokeTexture, UV) * o_color;

    }
`