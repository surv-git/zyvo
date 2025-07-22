"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Phone } from 'lucide-react';
import { SupplierContact } from '@/types/supplier-contact';

interface ContactNumbersManagerProps {
  contacts: SupplierContact[];
  onChange: (contacts: SupplierContact[]) => void;
  readonly?: boolean;
}

interface NewContact {
  contact_number: string;
  contact_name: string;
  type: 'Mobile' | 'Landline' | 'Toll-Free' | 'Whatsapp' | 'Fax' | 'Other';
  extension: string;
  is_primary: boolean;
  notes: string;
}

const defaultNewContact: NewContact = {
  contact_number: '',
  contact_name: '',
  type: 'Mobile',
  extension: '',
  is_primary: false,
  notes: '',
};

export default function ContactNumbersManager({ contacts, onChange, readonly = false }: ContactNumbersManagerProps) {
  const [newContact, setNewContact] = useState<NewContact>(defaultNewContact);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddContact = () => {
    if (!newContact.contact_number.trim() || !newContact.contact_name.trim()) {
      return;
    }

    // If this is set as primary, remove primary from existing contacts
    let updatedContacts = [...contacts];
    if (newContact.is_primary) {
      updatedContacts = updatedContacts.map(contact => ({
        ...contact,
        is_primary: false,
      }));
    }

    // Create new contact with temporary ID
    const contactToAdd: SupplierContact = {
      id: `temp-${Date.now()}`,
      _id: `temp-${Date.now()}`,
      supplier_id: '', // Will be set when saving
      contact_number: newContact.contact_number,
      formatted_number: newContact.contact_number,
      contact_name: newContact.contact_name,
      type: newContact.type,
      extension: newContact.extension || null,
      is_primary: newContact.is_primary,
      notes: newContact.notes || null,
      full_contact_info: `${newContact.contact_number} (${newContact.contact_name})`,
      is_active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __v: 0,
    };

    onChange([...updatedContacts, contactToAdd]);
    setNewContact(defaultNewContact);
    setIsAdding(false);
  };

  const handleRemoveContact = (contactId: string) => {
    const updatedContacts = contacts.filter(contact => contact.id !== contactId);
    onChange(updatedContacts);
  };

  const handleSetPrimary = (contactId: string) => {
    const updatedContacts = contacts.map(contact => ({
      ...contact,
      is_primary: contact.id === contactId,
    }));
    onChange(updatedContacts);
  };

  const handleUpdateContact = (contactId: string, field: keyof SupplierContact, value: string | boolean | null) => {
    const updatedContacts = contacts.map(contact => {
      if (contact.id === contactId) {
        const updated = { ...contact, [field]: value };
        if (field === 'contact_number' && typeof value === 'string') {
          updated.formatted_number = value;
          updated.full_contact_info = `${value} (${updated.contact_name})`;
        }
        if (field === 'contact_name' && typeof value === 'string') {
          updated.full_contact_info = `${updated.contact_number} (${value})`;
        }
        return updated;
      }
      return contact;
    });
    onChange(updatedContacts);
  };

  if (readonly) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Numbers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contact numbers</p>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-3 border rounded">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contact.formatted_number}</span>
                      <Badge variant="outline" className="text-xs">
                        {contact.type}
                      </Badge>
                      {contact.is_primary && (
                        <Badge variant="default" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{contact.contact_name}</p>
                    {contact.notes && (
                      <p className="text-xs text-muted-foreground">{contact.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Numbers
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing contacts */}
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-center gap-3 p-3 border rounded">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Phone Number</Label>
                  <Input
                    value={contact.contact_number}
                    onChange={(e) => handleUpdateContact(contact.id, 'contact_number', e.target.value)}
                    placeholder="Phone number"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Contact Name</Label>
                  <Input
                    value={contact.contact_name}
                    onChange={(e) => handleUpdateContact(contact.id, 'contact_name', e.target.value)}
                    placeholder="Contact person name"
                    className="h-8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={contact.type}
                    onValueChange={(value) => handleUpdateContact(contact.id, 'type', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mobile">Mobile</SelectItem>
                      <SelectItem value="Landline">Landline</SelectItem>
                      <SelectItem value="Toll-Free">Toll-Free</SelectItem>
                      <SelectItem value="Whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="Fax">Fax</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Extension</Label>
                  <Input
                    value={contact.extension || ''}
                    onChange={(e) => handleUpdateContact(contact.id, 'extension', e.target.value)}
                    placeholder="Ext (optional)"
                    className="h-8"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={contact.is_primary}
                      onCheckedChange={() => handleSetPrimary(contact.id)}
                    />
                    <Label className="text-xs">Primary</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={contact.notes || ''}
                  onChange={(e) => handleUpdateContact(contact.id, 'notes', e.target.value)}
                  placeholder="Additional notes (optional)"
                  className="h-16 resize-none"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRemoveContact(contact.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Add new contact form */}
        {isAdding && (
          <div className="p-4 border-2 border-dashed rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-contact-number">Phone Number *</Label>
                <Input
                  id="new-contact-number"
                  value={newContact.contact_number}
                  onChange={(e) => setNewContact(prev => ({ ...prev, contact_number: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="new-contact-name">Contact Name *</Label>
                <Input
                  id="new-contact-name"
                  value={newContact.contact_name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="Contact person name"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="new-contact-type">Type</Label>
                <Select
                  value={newContact.type}
                  onValueChange={(value: 'Mobile' | 'Landline' | 'Toll-Free' | 'Whatsapp' | 'Fax' | 'Other') => setNewContact(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="Landline">Landline</SelectItem>
                    <SelectItem value="Toll-Free">Toll-Free</SelectItem>
                    <SelectItem value="Whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="Fax">Fax</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="new-contact-extension">Extension</Label>
                <Input
                  id="new-contact-extension"
                  value={newContact.extension}
                  onChange={(e) => setNewContact(prev => ({ ...prev, extension: e.target.value }))}
                  placeholder="Extension (optional)"
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newContact.is_primary}
                    onCheckedChange={(checked) => setNewContact(prev => ({ ...prev, is_primary: checked }))}
                  />
                  <Label>Primary</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="new-contact-notes">Notes</Label>
              <Textarea
                id="new-contact-notes"
                value={newContact.notes}
                onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes (optional)"
                className="h-20 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAddContact}
                disabled={!newContact.contact_number.trim() || !newContact.contact_name.trim()}
              >
                Add Contact
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewContact(defaultNewContact);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {contacts.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No contact numbers added yet. Click &quot;Add Contact&quot; to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
