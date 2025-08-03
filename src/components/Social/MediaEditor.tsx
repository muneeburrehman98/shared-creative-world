import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaEffect, MediaMetadata } from '@/lib/social/types';

interface MediaEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (editedUrl: string, metadata: MediaMetadata) => void;
}

const FILTERS = [
  { name: 'Normal', preview: '' },
  { name: 'Clarendon', preview: 'brightness(1.1) contrast(1.2) saturate(1.3)' },
  { name: 'Gingham', preview: 'sepia(0.2) brightness(1.05)' },
  { name: 'Moon', preview: 'grayscale(1)' },
  { name: 'Lark', preview: 'brightness(1.1) contrast(0.9) saturate(1.1)' },
  { name: 'Reyes', preview: 'sepia(0.4) brightness(1.1) contrast(0.9)' },
  { name: 'Juno', preview: 'saturate(1.4) contrast(1.1)' },
  { name: 'Slumber', preview: 'sepia(0.4) saturate(0.8)' },
  { name: 'Crema', preview: 'sepia(0.2) brightness(1.1) contrast(0.95)' },
  { name: 'Ludwig', preview: 'sepia(0.25) contrast(1.05) brightness(1.05) saturate(2)' },
];

const EFFECTS = [
  { name: 'None', preview: '' },
  { name: 'Vignette', preview: 'brightness(0.9)' },
  { name: 'Blur', preview: 'blur(2px)' },
  { name: 'Sharpen', preview: 'contrast(1.5)' },
  { name: 'Vintage', preview: 'sepia(0.5) hue-rotate(20deg)' },
  { name: 'Dramatic', preview: 'contrast(1.4) brightness(0.9)' },
];

const LAYOUTS = [
  { name: 'Original', value: 'original' },
  { name: 'Square', value: 'square' },
  { name: 'Portrait', value: 'portrait' },
  { name: 'Landscape', value: 'landscape' },
];

export const MediaEditor = ({ open, onOpenChange, imageUrl, onSave }: MediaEditorProps) => {
  const [activeFilter, setActiveFilter] = useState<string>('Normal');
  const [activeEffect, setActiveEffect] = useState<string>('None');
  const [activeLayout, setActiveLayout] = useState<string>('original');
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [warmth, setWarmth] = useState<number>(0);
  
  const [previewStyle, setPreviewStyle] = useState<string>('');
  
  // Update preview style when settings change
  useEffect(() => {
    let style = '';
    
    // Add filter
    const filter = FILTERS.find(f => f.name === activeFilter);
    if (filter && filter.preview) {
      style += filter.preview;
    }
    
    // Add effect
    const effect = EFFECTS.find(e => e.name === activeEffect);
    if (effect && effect.preview) {
      style += ` ${effect.preview}`;
    }
    
    // Add adjustments
    style += ` brightness(${brightness/100}) contrast(${contrast/100}) saturate(${saturation/100})`;
    
    // Add warmth (color temperature)
    if (warmth !== 0) {
      style += ` sepia(${warmth > 0 ? warmth/100 : 0}) hue-rotate(${warmth < 0 ? warmth : 0}deg)`;
    }
    
    setPreviewStyle(style);
  }, [activeFilter, activeEffect, brightness, contrast, saturation, warmth]);
  
  const handleSave = () => {
    // In a real implementation, we would apply the filters to the image
    // and generate a new image URL. For this example, we'll just pass the metadata.
    const effects: MediaEffect[] = [];
    
    if (activeFilter !== 'Normal') {
      effects.push({
        type: 'filter',
        name: activeFilter,
      });
    }
    
    if (activeEffect !== 'None') {
      effects.push({
        type: 'effect',
        name: activeEffect,
      });
    }
    
    if (brightness !== 100 || contrast !== 100 || saturation !== 100 || warmth !== 0) {
      effects.push({
        type: 'adjustment',
        name: 'custom',
        parameters: {
          brightness: brightness/100,
          contrast: contrast/100,
          saturation: saturation/100,
          warmth: warmth,
        }
      });
    }
    
    const metadata: MediaMetadata = {
      effects,
      originalUrl: imageUrl,
      layout: activeLayout as 'original' | 'square' | 'portrait' | 'landscape',
      creationInfo: {
        createdWith: 'creative_mode',
      }
    };
    
    // In a real implementation, we would generate a new URL with the applied effects
    // For now, we'll just pass the original URL and the metadata
    onSave(imageUrl, metadata);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Media</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative overflow-hidden rounded-md">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-auto object-cover"
              style={{ filter: previewStyle }}
            />
          </div>
          
          <Tabs defaultValue="filters">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
              <TabsTrigger value="adjust">Adjust</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>
            
            <TabsContent value="filters" className="pt-4">
              <div className="grid grid-cols-5 gap-2">
                {FILTERS.map((filter) => (
                  <div 
                    key={filter.name}
                    className={`cursor-pointer text-center ${activeFilter === filter.name ? 'ring-2 ring-primary rounded-md' : ''}`}
                    onClick={() => setActiveFilter(filter.name)}
                  >
                    <div className="overflow-hidden rounded-md mb-1">
                      <img 
                        src={imageUrl} 
                        alt={filter.name} 
                        className="w-full h-16 object-cover"
                        style={{ filter: filter.preview }}
                      />
                    </div>
                    <span className="text-xs">{filter.name}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="effects" className="pt-4">
              <div className="grid grid-cols-3 gap-2">
                {EFFECTS.map((effect) => (
                  <div 
                    key={effect.name}
                    className={`cursor-pointer text-center ${activeEffect === effect.name ? 'ring-2 ring-primary rounded-md' : ''}`}
                    onClick={() => setActiveEffect(effect.name)}
                  >
                    <div className="overflow-hidden rounded-md mb-1">
                      <img 
                        src={imageUrl} 
                        alt={effect.name} 
                        className="w-full h-16 object-cover"
                        style={{ filter: effect.preview }}
                      />
                    </div>
                    <span className="text-xs">{effect.name}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="adjust" className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Brightness</span>
                  <span className="text-sm">{brightness}%</span>
                </div>
                <Slider 
                  value={[brightness]} 
                  min={0} 
                  max={200} 
                  step={1}
                  onValueChange={(value) => setBrightness(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Contrast</span>
                  <span className="text-sm">{contrast}%</span>
                </div>
                <Slider 
                  value={[contrast]} 
                  min={0} 
                  max={200} 
                  step={1}
                  onValueChange={(value) => setContrast(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Saturation</span>
                  <span className="text-sm">{saturation}%</span>
                </div>
                <Slider 
                  value={[saturation]} 
                  min={0} 
                  max={200} 
                  step={1}
                  onValueChange={(value) => setSaturation(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Warmth</span>
                  <span className="text-sm">{warmth > 0 ? `+${warmth}` : warmth}</span>
                </div>
                <Slider 
                  value={[warmth]} 
                  min={-100} 
                  max={100} 
                  step={1}
                  onValueChange={(value) => setWarmth(value[0])}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="layout" className="pt-4">
              <div className="grid grid-cols-4 gap-2">
                {LAYOUTS.map((layout) => (
                  <div 
                    key={layout.name}
                    className={`cursor-pointer text-center ${activeLayout === layout.value ? 'ring-2 ring-primary rounded-md' : ''}`}
                    onClick={() => setActiveLayout(layout.value)}
                  >
                    <div className="overflow-hidden rounded-md mb-1 aspect-ratio-box">
                      <div className={`w-full h-16 flex items-center justify-center bg-muted`}>
                        <div className={`
                          ${layout.value === 'square' ? 'w-12 h-12' : ''}
                          ${layout.value === 'portrait' ? 'w-8 h-12' : ''}
                          ${layout.value === 'landscape' ? 'w-12 h-8' : ''}
                          ${layout.value === 'original' ? 'w-10 h-12' : ''}
                          bg-primary-foreground
                        `}></div>
                      </div>
                    </div>
                    <span className="text-xs">{layout.name}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Apply</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};