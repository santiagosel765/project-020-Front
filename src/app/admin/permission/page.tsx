"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRoles, type Role } from '@/services/roleService';
import { getPages, getRolePages, updateRolePages, type Page } from '@/services/pageService';

export default function PermissionPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [assignedIds, setAssignedIds] = useState<number[]>([]);
  const [selectedAvailable, setSelectedAvailable] = useState<number[]>([]);
  const [selectedAssigned, setSelectedAssigned] = useState<number[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadBase = async () => {
      try {
        const [{ items: rolesData }, { items: pagesData }] = await Promise.all([
          getRoles({ page: 1, limit: 100, includeInactive: true }),
          getPages({ page: 1, limit: 200, includeInactive: true }),
        ]);
        setRoles(rolesData.filter(r => r.activo));
        setPages(pagesData.filter(p => p.activo));
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error al cargar datos', description: 'No se pudieron obtener roles o páginas.' });
      }
    };
    loadBase();
  }, [toast]);

  useEffect(() => {
    const loadAssigned = async () => {
      if (!selectedRole) {
        setAssignedIds([]);
        return;
      }
      setLoadingList(true);
      try {
        const ids = await getRolePages(selectedRole);
        setAssignedIds(ids);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error al cargar permisos', description: 'No se pudieron obtener las páginas asignadas.' });
      } finally {
        setLoadingList(false);
        setSelectedAvailable([]);
        setSelectedAssigned([]);
      }
    };
    loadAssigned();
  }, [selectedRole, toast]);

  const availablePages = useMemo(() => pages.filter(p => !assignedIds.includes(p.id!)), [pages, assignedIds]);
  const assignedPages = useMemo(() => pages.filter(p => assignedIds.includes(p.id!)), [pages, assignedIds]);

  const moveToAssigned = () => {
    setAssignedIds(prev => [...prev, ...selectedAvailable]);
    setSelectedAvailable([]);
  };
  const moveToAvailable = () => {
    setAssignedIds(prev => prev.filter(id => !selectedAssigned.includes(id)));
    setSelectedAssigned([]);
  };
  const chooseAll = () => {
    setAssignedIds(pages.map(p => p.id!));
    setSelectedAvailable([]);
    setSelectedAssigned([]);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await updateRolePages(selectedRole, assignedIds);
      toast({ title: 'Permisos actualizados', description: 'Los permisos han sido guardados.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: 'Hubo un problema al guardar los permisos.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col glassmorphism">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>Permisos por Rol</CardTitle>
          <CardDescription>Asigne las páginas activas a cada rol.</CardDescription>
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Seleccione un rol" />
          </SelectTrigger>
          <SelectContent>
            {roles.map(r => (
              <SelectItem key={r.id} value={String(r.id ?? '')}>
                {r.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 flex-1">
        {loadingList ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-1 gap-4">
            <div className="flex-1 border rounded p-2 overflow-y-auto">
              <h3 className="font-semibold mb-2">No asignadas</h3>
              <div className="space-y-1">
                {availablePages.map(p => (
                  <label key={p.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedAvailable.includes(p.id!)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedAvailable(prev => [...prev, p.id!]);
                        else setSelectedAvailable(prev => prev.filter(id => id !== p.id));
                      }}
                    />
                    <span>{p.nombre}</span>
                  </label>
                ))}
                {availablePages.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin páginas</p>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center gap-2">
              <Button variant="outline" onClick={moveToAssigned} disabled={selectedAvailable.length === 0}>
                →
              </Button>
              <Button variant="outline" onClick={moveToAvailable} disabled={selectedAssigned.length === 0}>
                ←
              </Button>
              <Button variant="outline" onClick={chooseAll} disabled={availablePages.length === 0}>
                Elegir todos
              </Button>
            </div>
            <div className="flex-1 border rounded p-2 overflow-y-auto">
              <h3 className="font-semibold mb-2">Asignadas</h3>
              <div className="space-y-1">
                {assignedPages.map(p => (
                  <label key={p.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedAssigned.includes(p.id!)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedAssigned(prev => [...prev, p.id!]);
                        else setSelectedAssigned(prev => prev.filter(id => id !== p.id));
                      }}
                    />
                    <span>{p.nombre}</span>
                  </label>
                ))}
                {assignedPages.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin páginas</p>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!selectedRole || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

