

"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, UserPlus, Edit, Trash2, FileUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { User } from '@/lib/data';
import { UserFormModal } from './user-form-modal';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface UsersTableProps {
  users: User[];
  onSaveUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

type UserInput = Omit<User, 'id'> & { id?: string };

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 2) {
    return `${names[0][0]}${names[2][0]}`.toUpperCase();
  }
  if (names.length > 1) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return names[0] ? names[0][0].toUpperCase() : '';
};

const ITEMS_PER_PAGE = 10;

export function UsersTable({ users, onSaveUser, onDeleteUser }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);


  const filteredUsers = useMemo(() =>
    users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    ), [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  
  const handleOpenModal = (user?: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(undefined);
  };

  const handleSaveUser = (user: UserInput) => {
    const withId: User = user.id ? (user as User) : { ...user, id: Date.now().toString() };
    onSaveUser(withId);
    handleCloseModal();
  };
  
  const handleDeleteUser = (userId: string) => {
    onDeleteUser(userId);
  }

  const handleBulkUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Here you would process the file (e.g., read CSV/Excel)
      // For now, we'll just show a toast notification
      toast({
        title: "Archivo Seleccionado",
        description: `Se ha seleccionado el archivo: ${file.name}. La funcionalidad de carga aún no está implementada.`,
      });
      // Clear the input value to allow selecting the same file again
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  return (
    <>
      <Card className="w-full h-full flex flex-col glassmorphism">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1.5">
                  <CardTitle>Gestión de Usuarios ({users.length})</CardTitle>
                  <CardDescription>Cree, edite y gestione los usuarios de la plataforma.</CardDescription>
              </div>
              <div className='flex items-center gap-2'>
                  <div className="relative w-full md:w-auto flex-grow">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                      placeholder="Buscar usuarios..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1);
                      }}
                      />
                  </div>
                  <Input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  />
                  <Button variant="outline" onClick={handleBulkUploadClick}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Carga Masiva
                  </Button>
                  <Button onClick={() => handleOpenModal()}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Crear Nuevo
                  </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Puesto</TableHead>
                <TableHead className="hidden lg:table-cell">Gerencia</TableHead>
                <TableHead className="hidden md:table-cell">Usuario</TableHead>
                <TableHead className="hidden lg:table-cell">Cod. Empleado</TableHead>
                <TableHead className="hidden xl:table-cell">Teléfono</TableHead>
                <TableHead className="hidden xl:table-cell">Correo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map(user => (
                <TableRow key={user.id}>
                   <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person avatar"/>
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{user.position}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{user.department}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{user.username}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{user.employeeCode}</TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">{user.phone}</TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenModal(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <div className="flex items-center justify-end space-x-2 py-4 px-6 border-t">
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Anterior</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <span className="sr-only">Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
      <UserFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveUser}
        user={selectedUser}
      />
    </>
  );
}
