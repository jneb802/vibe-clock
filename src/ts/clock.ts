import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { BoundingBoxGizmo } from "@babylonjs/core/Gizmos/boundingBoxGizmo";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import * as BABYLON from "@babylonjs/core";
import * as opentype from "opentype.js";
import earcut from "earcut";
import { Compiler, Font, TextMeshBuilder } from "babylon.font";
import { ClockMaterial } from "./clockMaterial";

// Import textures - swap these out to test different materials!
import metalDiffuse from "../assets/textures/concrete_wall_006_diff_1k.jpg";
import metalRoughness from "../assets/textures/concrete_wall_006_nor_gl_1k.jpg";
import metalNormal from "../assets/textures/concrete_wall_006_rough_1k.jpg";

/**
 * Clock class that displays the current time as 3D extruded text meshes using real fonts.
 * The clock is fixed in world space and interacts with the water simulation.
 */
export class Clock {
    private readonly scene: Scene;
    private readonly camera: ArcRotateCamera;
    
    // Container for all clock digits
    private clockContainer: TransformNode;
    
    // Mesh instances for each digit position: [H][H][:][M][M]
    private digitMeshes: (Mesh | null)[] = [null, null, null, null, null];
    
    // Material for the clock digits
    private clockMaterial: ClockMaterial;
    
    // Current displayed time
    private currentTimeString: string = "";
    
    // Time tracking for updates
    private lastUpdateTime: number = 0;
    
    // Font system
    private compiler: Compiler | null = null;
    private font: Font | null = null;
    private textBuilder: TextMeshBuilder | null = null;
    private isReady: boolean = false;
    
    // Configuration
    private readonly digitHeight: number = 1.5; // 1.5x larger than before
    private readonly digitDepth: number = 0.15;
    private readonly digitSpacing: number = 0.6;

    
    constructor(scene: Scene, camera: ArcRotateCamera) {
        this.scene = scene;
        this.camera = camera;
        
        // Create container for all clock digits
        this.clockContainer = new TransformNode("clockContainer", scene);
        this.clockContainer.position = new Vector3(-10, 0, 0);
        
        // Create material for digits - Tweak these values to change the look!
        this.clockMaterial = new ClockMaterial(scene, {
            textures: {
                diffuse: metalDiffuse,
                roughness: metalRoughness,
                normal: metalNormal
            },
            metallic: 0.5,           // 0-1: Lower = less reflective
            roughness: 0.7,          // 0-1: Lower = shinier
            textureScale: 0.5,       // Increase for more texture detail
        });
        
        // Initialize font system asynchronously
        this.initializeFont();
    }
    
    /**
     * Initializes the font system and loads the font file.
     * This is an async operation that runs in the background.
     */
    private async initializeFont(): Promise<void> {
        try {
            console.log("Starting clock font initialization...");
            
            // Use direct path to font in dist folder
            const fontUrl = "/assets/Roboto-Regular.ttf";
            console.log("Font URL:", fontUrl);
            
            // Initialize the WASM compiler
            console.log("Building compiler...");
            this.compiler = await Compiler.Build();
            console.log("Compiler built successfully");
            
            // Load the font
            console.log("Loading font...");
            this.font = await Font.Install(fontUrl, this.compiler, opentype);
            console.log("Font loaded successfully");
            
            // Create the text mesh builder
            this.textBuilder = new TextMeshBuilder(BABYLON, earcut);
            console.log("TextMeshBuilder created");
            
            this.isReady = true;
            
            // Now that font is loaded, create initial time display
            this.updateTime();
            
            console.log("Clock initialized and displaying time");
        } catch (error) {
            console.error("Failed to load clock font:", error);
        }
    }
    
    /**
     * Creates a 3D text mesh for a single character using the loaded font.
     */
    private createTextMesh(text: string): Mesh | null {
        if (!this.textBuilder || !this.font || !this.isReady) {
            console.log("Cannot create text mesh - system not ready");
            return null;
        }
        
        try {
            console.log(`Creating text mesh for "${text}"`);
            const mesh = this.textBuilder.create({
                font: this.font,
                text: text,
                size: 300, // Font size in font units
                depth: this.digitDepth * 100, // Scale depth to match
                ppc: 3, // Points per curve (higher = smoother)
                eps: 0.001, // Decimation threshold
                sideOrientation: BABYLON.Mesh.DOUBLESIDE,
            }, this.scene);
            
            if (mesh) {
                // Scale the mesh down to our desired size
                const scaleFactor = this.digitHeight / 100;
                // Flip X scaling to mirror text correctly when rotated
                mesh.scaling.set(-scaleFactor, scaleFactor, scaleFactor);
                
                mesh.material = this.clockMaterial.getMaterial();
                mesh.isVisible = true;
                mesh.checkCollisions = false;
                
                // Parent to the clock container
                mesh.parent = this.clockContainer;
                
                // Force update bounding info
                mesh.refreshBoundingInfo();
                
                console.log(`Mesh created successfully for "${text}":`, {
                    boundingBox: mesh.getBoundingInfo().boundingBox,
                    scaling: mesh.scaling,
                    position: mesh.position,
                    isVisible: mesh.isVisible,
                    material: mesh.material?.name
                });
            } else {
                console.warn(`Mesh creation returned null for "${text}"`);
            }
            
            return mesh;
        } catch (error) {
            console.error(`Failed to create text mesh for "${text}":`, error);
            return null;
        }
    }
    
    /**
     * Updates the time display based on current browser time.
     * Only updates once per second for efficiency.
     */
    public updateTime(): void {
        if (!this.isReady) {
            return; // Font not loaded yet
        }
        
        const now = Date.now();
        
        // Only update once per second
        if (now - this.lastUpdateTime < 1000) {
            return;
        }
        
        this.lastUpdateTime = now;
        
        const date = new Date();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        
        // Only update if time has changed
        if (timeString === this.currentTimeString) {
            return;
        }
        
        this.currentTimeString = timeString;
        
        // Update each digit
        this.updateDigitMesh(0, hours[0]);
        this.updateDigitMesh(1, hours[1]);
        this.updateDigitMesh(2, ':');
        this.updateDigitMesh(3, minutes[0]);
        this.updateDigitMesh(4, minutes[1]);
        
        // Position all digits after updating
        this.positionDigits();
    }
    
    /**
     * Updates a specific digit mesh to display the given character.
     * @param position Position index (0-4)
     * @param char Character to display ("0"-"9" or ":")
     */
    private updateDigitMesh(position: number, char: string): void {
        // Dispose old mesh if it exists
        if (this.digitMeshes[position]) {
            this.digitMeshes[position]!.dispose();
            this.digitMeshes[position] = null;
        }
        
        // Create new mesh
        const mesh = this.createTextMesh(char);
        if (mesh) {
            this.digitMeshes[position] = mesh;
        }
    }
    
    /**
     * Positions all digit meshes relative to the container.
     * Called after digits are updated.
     * Uses actual mesh bounding boxes for accurate spacing.
     */
    private positionDigits(): void {
        // First, set up rotations and temporary positions
        for (let i = 0; i < this.digitMeshes.length; i++) {
            const mesh = this.digitMeshes[i];
            if (mesh) {
                mesh.rotation.x = -Math.PI / 2;
                mesh.rotation.y = 0;
                mesh.rotation.z = 0;
                mesh.position.set(0, 0, 0);
                mesh.computeWorldMatrix(true);
            }
        }
        
        // Helper to get width and center offset from a mesh
        const getMeshInfo = (mesh: Mesh | null) => {
            if (!mesh) return { width: 0, centerOffset: 0 };
            mesh.refreshBoundingInfo();
            const bbox = mesh.getBoundingInfo().boundingBox;
            const width = Math.abs(bbox.maximum.x - bbox.minimum.x) * Math.abs(mesh.scaling.x);
            const centerOffset = ((bbox.maximum.x + bbox.minimum.x) / 2) * mesh.scaling.x;
            return { width, centerOffset };
        };
        
        // Get info for all digits
        const info = this.digitMeshes.map(getMeshInfo);
        
        // Position digits with colon at center (x=0)
        const colonHalfWidth = info[2].width / 2;
        const colonGap = this.digitSpacing * 0.5;
        
        let xPos = 0; // Start from colon
        xPos += colonHalfWidth + colonGap + info[1].width / 2; // Second hour digit
        const pos1 = xPos;
        xPos += info[1].width / 2 + this.digitSpacing + info[0].width / 2; // First hour digit
        const pos0 = xPos;
        
        xPos = 0; // Back to colon
        xPos -= colonHalfWidth + colonGap + info[3].width / 2; // First minute digit
        const pos3 = xPos;
        xPos -= info[3].width / 2 + this.digitSpacing + info[4].width / 2; // Second minute digit
        const pos4 = xPos;
        
        const positions = [pos0, pos1, 0, pos3, pos4];
        
        // Apply positions
        this.digitMeshes.forEach((mesh, i) => {
            if (mesh) {
                mesh.position.set(positions[i] - info[i].centerOffset, 0, 0);
            }
        });
    }
    
    /**
     * Updates the clock display.
     * Should be called every frame.
     */
    public update(): void {
        // Update time display
        this.updateTime();
    }
    
    /**
     * Returns whether the font has finished loading.
     */
    public get ready(): boolean {
        return this.isReady;
    }
    
    /**
     * Returns the clock container transform node.
     * Use this to control the position and rotation of the entire clock.
     */
    public get container(): TransformNode {
        return this.clockContainer;
    }
    
    /**
     * Disposes all clock resources.
     */
    public dispose(): void {
        this.digitMeshes.forEach(mesh => {
            if (mesh) {
                mesh.dispose();
            }
        });
        this.clockMaterial.dispose();
        this.clockContainer.dispose();
    }
}
