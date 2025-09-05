
"use client";

import React, { useState, useEffect } from 'react';
import { SupervisionTable } from "@/components/supervision-table";
import { Document, User } from "@/lib/data";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function SupervisionPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [docsRes, usersRes] = await Promise.all([
                    fetch('/api/documents'),
                    fetch('/api/users')
                ]);

                if (!docsRes.ok || !usersRes.ok) {
                    throw new Error('Failed to fetch data');
                }

                const docsData = await docsRes.json();
                const usersData = await usersRes.json();
                
                setDocuments(docsData);
                setUsers(usersData);

            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error al cargar datos',
                    description: 'No se pudieron obtener los datos para la supervisión.',
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [toast]);
    
    const supervisionDocuments = documents.slice(0, 20).map((doc, index) => ({
        ...doc,
        sentBy: users.length > 0 ? users[index % users.length] : {} as User, 
        statusDescription: doc.status === 'Rechazado' ? 'Firma rechazada por Finanzas.' : 'Pendiente de firma por CEO.',
    }));

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-1/3" />
                </div>
                 <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                 </div>
                <Skeleton className="h-[600px] w-full" />
            </div>
        );
    }

    return (
      <div className="h-full">
          <SupervisionTable 
              documents={supervisionDocuments} 
              title="Supervisión de Documentos"
              description="Monitoree el estado y progreso de todos los documentos en tiempo real."
          />
      </div>
    );
  }
