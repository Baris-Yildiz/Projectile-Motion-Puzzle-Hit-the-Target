const pickupFragmentShader = `
    in vec4 o_color;
    in vec2 f_uv;
    
    out vec4 f_color;
    
    uniform sampler2D glowTexture;
    void main()
    {
        vec2 UV = f_uv;
        
        f_color = texture(glowTexture, UV) * o_color;
        if (f_color.a < 0.5) discard;
    }
`