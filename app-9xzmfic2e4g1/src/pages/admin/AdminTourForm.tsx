// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/pages/admin/AdminTourForm.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/db/supabase';
import type { Tour, TourItineraryItem } from '@/types/agency';

const emptyItineraryItem: TourItineraryItem = {
  time: '09:00',
  title: '',
  description: '',
  duration_minutes: 30,
};

export default function AdminTourForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = id && id !== 'yeni';
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    name_en: '',
    slug: '',
    short_description: '',
    short_description_en: '',
    description: '',
    description_en: '',
    duration_hours: 8,
    start_time: '09:30',
    
    group_enabled: true,
    group_price_adult: 50,
    group_price_child: 35,
    group_min_participants: 4,
    group_max_participants: 15,
    
    private_enabled: true,
    private_price_1_3: 200,
    private_price_4_6: 280,
    private_price_7_10: 350,
    private_price_11_14: 420,
    private_price_15_plus: 500,
    
    is_active: true,
    is_featured: false,
    sort_order: 1,
  });
  
  const [includes, setIncludes] = useState<string[]>(['']);
  const [excludes, setExcludes] = useState<string[]>(['']);
  const [itinerary, setItinerary] = useState<TourItineraryItem[]>([{ ...emptyItineraryItem }]);

  useEffect(() => {
    if (isEditing) {
      loadTour(id);
    }
  }, [id]);

  const loadTour = async (tourId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('id', tourId)
        .single();
      
      if (error) throw error;
      if (data) {
        setFormData({
          code: data.code || '',
          name: data.name || '',
          name_en: data.name_en || '',
          slug: data.slug || '',
          short_description: data.short_description || '',
          short_description_en: data.short_description_en || '',
          description: data.description || '',
          description_en: data.description_en || '',
          duration_hours: data.duration_hours || 8,
          start_time: data.start_time || '09:30',
          group_enabled: data.group_enabled ?? true,
          group_price_adult: data.group_price_adult || 50,
          group_price_child: data.group_price_child || 35,
          group_min_participants: data.group_min_participants || 4,
          group_max_participants: data.group_max_participants || 15,
          private_enabled: data.private_enabled ?? true,
          private_price_1_3: data.private_price_1_3 || 200,
          private_price_4_6: data.private_price_4_6 || 280,
          private_price_7_10: data.private_price_7_10 || 350,
          private_price_11_14: data.private_price_11_14 || 420,
          private_price_15_plus: data.private_price_15_plus || 500,
          is_active: data.is_active ?? true,
          is_featured: data.is_featured ?? false,
          sort_order: data.sort_order || 1,
        });
        setIncludes(data.includes || ['']);
        setExcludes(data.excludes || ['']);
        setItinerary(data.itinerary || [{ ...emptyItineraryItem }]);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Tur yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const tourData = {
        ...formData,
        includes: includes.filter(i => i.trim()),
        excludes: excludes.filter(e => e.trim()),
        itinerary: itinerary.filter(i => i.title.trim()),
        currency: 'EUR',
      };
      
      if (isEditing) {
        const { error } = await supabase
          .from('tours')
          .update(tourData)
          .eq('id', id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tours')
          .insert([tourData]);
        
        if (error) throw error;
      }
      
      navigate('/admin/turlar');
    } catch (err: any) {
      console.error('Error:', err);
      alert('Kaydetme hatası: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setSaving(false);
    }
  };

  // Array helpers
  const addArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, '']);
  };

  const updateArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter(prev => prev.map((item, i) => i === index ? value : item));
  };

  const removeArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  // Itinerary helpers
  const addItineraryItem = () => {
    setItinerary(prev => [...prev, { ...emptyItineraryItem }]);
  };

  const updateItineraryItem = (index: number, field: keyof TourItineraryItem, value: any) => {
    setItinerary(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItineraryItem = (index: number) => {
    setItinerary(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="bg-background border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button type="button" variant="ghost" size="icon" asChild>
                  <Link to="/admin/turlar"><ChevronLeft className="w-5 h-5" /></Link>
                </Button>
                <div>
                  <h1 className="text-xl font-bold">
                    {isEditing ? 'Tur Düzenle' : 'Yeni Tur Ekle'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isEditing ? formData.name : 'Yeni bir günlük tur oluşturun'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Aktif</Label>
                </div>
                <Button type="submit" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">Genel</TabsTrigger>
              <TabsTrigger value="pricing">Fiyatlandırma</TabsTrigger>
              <TabsTrigger value="itinerary">Güzergah</TabsTrigger>
              <TabsTrigger value="includes">Dahil/Hariç</TabsTrigger>
            </TabsList>

            {/* Genel */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Genel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Tur Kodu</Label>
                      <Select
                        value={formData.code}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, code: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="red">🔴 Kırmızı</SelectItem>
                          <SelectItem value="green">🟢 Yeşil</SelectItem>
                          <SelectItem value="blue">🔵 Mavi</SelectItem>
                          <SelectItem value="custom">⭐ Özel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sıra</Label>
                      <Input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Tur Adı (TR)</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Örn: Kırmızı Tur"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tur Adı (EN)</Label>
                      <Input
                        value={formData.name_en}
                        onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                        placeholder="Örn: Red Tour"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>URL Slug</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="kirmizi-tur"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Süre (Saat)</Label>
                      <Input
                        type="number"
                        value={formData.duration_hours}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 8 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Başlangıç Saati</Label>
                      <Input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Kısa Açıklama (TR)</Label>
                    <Textarea
                      value={formData.short_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Detaylı Açıklama (TR)</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                    />
                    <Label>Öne Çıkan (Ana sayfada göster)</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fiyatlandırma */}
            <TabsContent value="pricing">
              <div className="grid gap-6">
                {/* Grup Turu */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Grup Turu</CardTitle>
                      <Switch
                        checked={formData.group_enabled}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, group_enabled: checked }))}
                      />
                    </div>
                  </CardHeader>
                  {formData.group_enabled && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Yetişkin (€)</Label>
                          <Input
                            type="number"
                            value={formData.group_price_adult}
                            onChange={(e) => setFormData(prev => ({ ...prev, group_price_adult: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Çocuk (€)</Label>
                          <Input
                            type="number"
                            value={formData.group_price_child}
                            onChange={(e) => setFormData(prev => ({ ...prev, group_price_child: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Min Kişi</Label>
                          <Input
                            type="number"
                            value={formData.group_min_participants}
                            onChange={(e) => setFormData(prev => ({ ...prev, group_min_participants: parseInt(e.target.value) || 4 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Kişi</Label>
                          <Input
                            type="number"
                            value={formData.group_max_participants}
                            onChange={(e) => setFormData(prev => ({ ...prev, group_max_participants: parseInt(e.target.value) || 15 }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Özel Tur */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Özel Tur</CardTitle>
                      <Switch
                        checked={formData.private_enabled}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, private_enabled: checked }))}
                      />
                    </div>
                  </CardHeader>
                  {formData.private_enabled && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                          <Label>1-3 Kişi (€)</Label>
                          <Input
                            type="number"
                            value={formData.private_price_1_3}
                            onChange={(e) => setFormData(prev => ({ ...prev, private_price_1_3: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>4-6 Kişi (€)</Label>
                          <Input
                            type="number"
                            value={formData.private_price_4_6}
                            onChange={(e) => setFormData(prev => ({ ...prev, private_price_4_6: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>7-10 Kişi (€)</Label>
                          <Input
                            type="number"
                            value={formData.private_price_7_10}
                            onChange={(e) => setFormData(prev => ({ ...prev, private_price_7_10: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>11-14 Kişi (€)</Label>
                          <Input
                            type="number"
                            value={formData.private_price_11_14}
                            onChange={(e) => setFormData(prev => ({ ...prev, private_price_11_14: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>15+ Kişi (€)</Label>
                          <Input
                            type="number"
                            value={formData.private_price_15_plus}
                            onChange={(e) => setFormData(prev => ({ ...prev, private_price_15_plus: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* Güzergah */}
            <TabsContent value="itinerary">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Günlük Program</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addItineraryItem}>
                      <Plus className="w-4 h-4 mr-2" />
                      Durak Ekle
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {itinerary.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 border rounded-lg">
                      <div className="flex items-center">
                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Saat</Label>
                          <Input
                            type="time"
                            value={item.time}
                            onChange={(e) => updateItineraryItem(index, 'time', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Başlık</Label>
                          <Input
                            value={item.title}
                            onChange={(e) => updateItineraryItem(index, 'title', e.target.value)}
                            placeholder="Örn: Göreme Açık Hava Müzesi"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Süre (dk)</Label>
                          <Input
                            type="number"
                            value={item.duration_minutes || ''}
                            onChange={(e) => updateItineraryItem(index, 'duration_minutes', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <Label>Açıklama</Label>
                          <Input
                            value={item.description || ''}
                            onChange={(e) => updateItineraryItem(index, 'description', e.target.value)}
                            placeholder="Kısa açıklama..."
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItineraryItem(index)}
                        disabled={itinerary.length <= 1}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dahil/Hariç */}
            <TabsContent value="includes">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Dahil */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-emerald-600">Tura Dahil</CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem(setIncludes)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {includes.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateArrayItem(setIncludes, index, e.target.value)}
                          placeholder="Örn: Klimalı araç"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayItem(setIncludes, index)}
                          disabled={includes.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Hariç */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-red-600">Tura Dahil Değil</CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem(setExcludes)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {excludes.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateArrayItem(setExcludes, index, e.target.value)}
                          placeholder="Örn: İçecekler"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayItem(setExcludes, index)}
                          disabled={excludes.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </div>
  );
}