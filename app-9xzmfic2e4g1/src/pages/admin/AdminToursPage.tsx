// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/pages/admin/AdminToursPage.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/db/supabase';
import type { Tour } from '@/types/agency';

export default function AdminToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTours();
  }, []);

  const loadTours = async () => {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setTours(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tours')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      loadTours();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tours')
        .update({ is_featured: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      loadTours();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deleteTour = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tours')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      loadTours();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getTourColor = (code: string) => {
    switch (code) {
      case 'red': return 'bg-red-500';
      case 'green': return 'bg-emerald-500';
      case 'blue': return 'bg-blue-500';
      default: return 'bg-amber-500';
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin"><ChevronLeft className="w-5 h-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Tur Yönetimi</h1>
              <p className="text-muted-foreground">{tours.length} tur kayıtlı</p>
            </div>
          </div>
          <Button asChild>
            <Link to="/admin/turlar/yeni">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Tur Ekle
            </Link>
          </Button>
        </div>

        {/* Tablo */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tur</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Grup Fiyat</TableHead>
                  <TableHead>Özel Fiyat</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : tours.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Henüz tur eklenmemiş
                    </TableCell>
                  </TableRow>
                ) : (
                  tours.map((tour) => (
                    <TableRow key={tour.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getTourColor(tour.code)}`} />
                          <div>
                            <div className="font-medium">{tour.name}</div>
                            <div className="text-sm text-muted-foreground">{tour.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tour.code}</Badge>
                      </TableCell>
                      <TableCell>{tour.duration_hours}s</TableCell>
                      <TableCell>
                        {tour.group_enabled ? `${tour.group_price_adult}€` : '-'}
                      </TableCell>
                      <TableCell>
                        {tour.private_enabled ? `${tour.private_price_1_3}€` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(tour.id, tour.is_active)}
                          >
                            {tour.is_active ? (
                              <Eye className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFeatured(tour.id, tour.is_featured)}
                          >
                            <Star className={`w-4 h-4 ${tour.is_featured ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/admin/turlar/${tour.id}`}>
                              <Pencil className="w-4 h-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Turu Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{tour.name}" turunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteTour(tour.id)}>
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}