import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { themeAPI } from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Palette, Plus, Edit3, Trash2, Eye, EyeOff, Star } from 'lucide-react';

interface ThemeData {
  _id: string;
  name: string;
  description: string;
  type: string;
  theme: string;
  isActive: boolean;
  isDefault: boolean;
  colorScheme: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    light: string;
    dark: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ThemesProps {
  user: any;
}

const Themes: React.FC<ThemesProps> = ({ user }) => {
  const [themes, setThemes] = useState<ThemeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeData | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadThemes();
    }
  }, [user]);

  const loadThemes = async () => {
    try {
      const response = await themeAPI.getAll();
      if (response.success) {
        setThemes(response.data || []);
      } else {
        throw new Error('Failed to load themes');
      }
    } catch (error: any) {
      toast.error('Failed to load themes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTheme = () => {
    setEditingTheme(null);
    setShowThemeDialog(true);
  };

  const handleEditTheme = (theme: ThemeData) => {
    setEditingTheme(theme);
    setShowThemeDialog(true);
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) return;

    try {
      const response = await themeAPI.delete(themeId);
      if (response.success) {
        toast.success('Theme deleted successfully');
        loadThemes();
      } else {
        throw new Error('Failed to delete theme');
      }
    } catch (error: any) {
      toast.error('Failed to delete theme');
    }
  };

  const handleToggleThemeStatus = async (themeId: string) => {
    try {
      const response = await themeAPI.toggleStatus(themeId);
      if (response.success) {
        loadThemes();
      } else {
        throw new Error('Failed to toggle theme status');
      }
    } catch (error: any) {
      toast.error('Failed to toggle theme status');
    }
  };

  const handleSetDefaultTheme = async (themeId: string, type: string) => {
    try {
      const response = await themeAPI.setDefault(themeId, type);
      if (response.success) {
        toast.success('Default theme updated successfully');
        loadThemes();
      } else {
        throw new Error('Failed to set default theme');
      }
    } catch (error: any) {
      toast.error('Failed to set default theme');
    }
  };

  const handleSaveTheme = async (formData: any) => {
    try {
      const response = editingTheme
        ? await themeAPI.update(editingTheme._id, formData)
        : await themeAPI.create(formData);

      if (response.success) {
        toast.success(response.message);
        setShowThemeDialog(false);
        loadThemes();
      } else {
        throw new Error('Failed to save theme');
      }
    } catch (error: any) {
      toast.error('Failed to save theme');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading themes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 px-4 md:px-6 lg:px-8">
      <div className="text-center space-y-3 md:space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full mb-2 md:mb-4 bg-gradient-to-br from-purple-500/20 to-purple-600/5">
          <Palette className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Theme Management
          </h1>
          <p className="text-muted-foreground text-sm md:text-base lg:text-lg mt-1 md:mt-2 px-2">
            Create and manage website themes for your application
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-primary">{themes.length}</div>
          <div className="text-sm text-muted-foreground">Total Themes</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-green-500">{themes.filter(t => t.isActive).length}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-yellow-500">{themes.filter(t => t.isDefault).length}</div>
          <div className="text-sm text-muted-foreground">Default</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-blue-500">{themes.filter(t => t.type === 'website').length}</div>
          <div className="text-sm text-muted-foreground">Website</div>
        </Card>
      </div>

      {/* Create Theme Button */}
      <div className="flex justify-end">
        <Button onClick={handleCreateTheme} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create Theme
        </Button>
      </div>

      {/* Themes Grid */}
      <div className="grid gap-4 md:gap-6">
        {themes.map((theme) => (
          <Card key={theme._id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{theme.name}</h3>
                      {theme.isDefault && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">{theme.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={theme.type === 'website' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                        {theme.type}
                      </Badge>
                      <Badge className={theme.theme === 'light' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                        {theme.theme}
                      </Badge>
                      {theme.isActive ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Eye className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!theme.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefaultTheme(theme._id, theme.type)}
                      className="text-yellow-600 hover:text-yellow-700"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleThemeStatus(theme._id)}
                  >
                    {theme.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTheme(theme)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTheme(theme._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Created: {new Date(theme.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(theme.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Theme Dialog */}
      <ThemeDialog
        isOpen={showThemeDialog}
        onClose={() => setShowThemeDialog(false)}
        onSave={handleSaveTheme}
        theme={editingTheme}
      />
    </div>
  );
};

// Theme Dialog Component
interface ThemeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  theme: ThemeData | null;
}

const ThemeDialog: React.FC<ThemeDialogProps> = ({ isOpen, onClose, onSave, theme }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'website',
    theme: 'light',
    colorScheme: {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      danger: '#dc3545',
      light: '#f8f9fa',
      dark: '#343a40'
    },
    typography: {
      headingFont: 'Inter, sans-serif',
      bodyFont: 'Inter, sans-serif'
    }
  });

  useEffect(() => {
    if (theme) {
      setFormData({
        name: theme.name,
        description: theme.description,
        type: theme.type,
        theme: theme.theme,
        colorScheme: theme.colorScheme,
        typography: theme.typography
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'website',
        theme: 'light',
        colorScheme: {
          primary: '#007bff',
          secondary: '#6c757d',
          success: '#28a745',
          danger: '#dc3545',
          light: '#f8f9fa',
          dark: '#343a40'
        },
        typography: {
          headingFont: 'Inter, sans-serif',
          bodyFont: 'Inter, sans-serif'
        }
      });
    }
  }, [theme]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateColor = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      colorScheme: {
        ...prev.colorScheme,
        [key]: value
      }
    }));
  };

  const updateTypography = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        [key]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{theme ? 'Edit Theme' : 'Create Theme'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <Select value={formData.theme} onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="border-t pt-6">
            <h4 className="text-lg font-medium mb-4">Color Scheme</h4>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary</label>
                <input
                  type="color"
                  value={formData.colorScheme.primary}
                  onChange={(e) => updateColor('primary', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary</label>
                <input
                  type="color"
                  value={formData.colorScheme.secondary}
                  onChange={(e) => updateColor('secondary', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Success</label>
                <input
                  type="color"
                  value={formData.colorScheme.success}
                  onChange={(e) => updateColor('success', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danger</label>
                <input
                  type="color"
                  value={formData.colorScheme.danger}
                  onChange={(e) => updateColor('danger', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Light</label>
                <input
                  type="color"
                  value={formData.colorScheme.light}
                  onChange={(e) => updateColor('light', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dark</label>
                <input
                  type="color"
                  value={formData.colorScheme.dark}
                  onChange={(e) => updateColor('dark', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Heading Font</label>
                <Select
                  value={formData.typography.headingFont}
                  onValueChange={(value) => updateTypography('headingFont', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="Playfair Display, serif">Playfair Display</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body Font</label>
                <Select
                  value={formData.typography.bodyFont}
                  onValueChange={(value) => updateTypography('bodyFont', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {theme ? 'Update Theme' : 'Create Theme'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Themes;