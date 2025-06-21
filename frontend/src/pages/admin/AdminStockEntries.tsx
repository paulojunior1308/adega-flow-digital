import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

const AdminStockEntries = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    unitCost: '',
    supplierId: '',
    notes: ''
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/products').then(res => setProducts(res.data));
    api.get('/admin/suppliers').then(res => setSuppliers(res.data));
    fetchEntries();
  }, []);

  const fetchEntries = () => {
    api.get('/admin/stock-entries').then(res => setEntries(res.data));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/stock-entries', {
        productId: form.productId,
        quantity: Number(form.quantity),
        unitCost: Number(form.unitCost),
        supplierId: form.supplierId || null,
        notes: form.notes
      });
      toast({ title: 'Entrada registrada com sucesso!' });
      setForm({ productId: '', quantity: '', unitCost: '', supplierId: '', notes: '' });
      fetchEntries();
    } catch (error) {
      toast({ title: 'Erro ao registrar entrada', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark">
          Entradas de Estoque
        </h1>
        
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Registrar nova entrada</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium mb-1">Produto*</label>
                  <Select value={form.productId} onValueChange={v => handleSelect('productId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fornecedor</label>
                  <Select value={form.supplierId} onValueChange={v => handleSelect('supplierId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {suppliers.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade*</label>
                  <Input type="number" name="quantity" value={form.quantity} onChange={handleChange} required min={1} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Custo Unitário (R$)*</label>
                  <Input type="number" name="unitCost" value={form.unitCost} onChange={handleChange} required min={0.01} step={0.01} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Observação</label>
                  <Textarea name="notes" value={form.notes} onChange={handleChange} rows={2} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={loading} className="bg-element-blue-dark hover:bg-element-blue-dark/90">
                    {loading ? 'Salvando...' : 'Registrar Entrada'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Entradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">Data</th>
                      <th className="py-2 text-left">Produto</th>
                      <th className="py-2 text-left">Fornecedor</th>
                      <th className="py-2 text-right">Quantidade</th>
                      <th className="py-2 text-right">Custo Unitário</th>
                      <th className="py-2 text-right">Total</th>
                      <th className="py-2 text-left">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry: any) => (
                      <tr key={entry.id} className="border-b">
                        <td className="py-2">{new Date(entry.createdAt).toLocaleDateString()}</td>
                        <td className="py-2">{entry.product?.name}</td>
                        <td className="py-2">{entry.supplier?.name || '-'}</td>
                        <td className="py-2 text-right">{entry.quantity}</td>
                        <td className="py-2 text-right">R$ {entry.unitCost.toFixed(2)}</td>
                        <td className="py-2 text-right">R$ {entry.totalCost.toFixed(2)}</td>
                        <td className="py-2">{entry.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStockEntries; 