import { Scene } from "@babylonjs/core/scene";
import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import "@babylonjs/core/Materials/Textures/Loaders/exrTextureLoader";

export interface MaterialTextures {
    diffuse: any;     // Webpack import
    roughness?: any;  // Optional
    normal?: any;     // Optional
}

export interface MaterialConfig {
    textures: MaterialTextures;
    metallic?: number;      // 0-1, default 1.0
    roughness?: number;     // 0-1, default 0.5
    emissive?: Color3;      // Glow color
    textureScale?: number;  // UV scale for tiling
}

/**
 * Material class for the 3D clock text with PBR metal textures.
 * Pass in different texture imports to easily swap materials.
 */
export class ClockMaterial {
    private material: PBRMetallicRoughnessMaterial;
    
    constructor(scene: Scene, config: MaterialConfig) {
        // Create PBR material for metallic look
        this.material = new PBRMetallicRoughnessMaterial("clockMaterial", scene);
        
        // Load textures
        const scale = config.textureScale || 1.0;
        
        const baseTexture = new Texture(config.textures.diffuse, scene);
        baseTexture.uScale = scale;
        baseTexture.vScale = scale;
        this.material.baseTexture = baseTexture;
        
        if (config.textures.roughness) {
            const roughMap = new Texture(config.textures.roughness, scene);
            roughMap.uScale = scale;
            roughMap.vScale = scale;
            this.material.metallicRoughnessTexture = roughMap;
        }
        
        if (config.textures.normal) {
            const normalMap = new Texture(config.textures.normal, scene);
            normalMap.uScale = scale;
            normalMap.vScale = scale;
            this.material.normalTexture = normalMap;
        }
        
        // Set material properties
        this.material.metallic = config.metallic !== undefined ? config.metallic : 1.0;
        this.material.roughness = config.roughness !== undefined ? config.roughness : 0.5;
        
        if (config.emissive) {
            this.material.emissiveColor = config.emissive;
        }
    }
    
    /**
     * Returns the Babylon material instance.
     */
    public getMaterial(): PBRMetallicRoughnessMaterial {
        return this.material;
    }
    
    /**
     * Dispose material resources.
     */
    public dispose(): void {
        this.material.dispose();
    }
}
