import { useState } from 'react';
import { Eye, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReadmeEditorProps {
  content: string;
  onSave: (content: string) => void;
  canEdit: boolean;
}

const ReadmeEditor = ({ content, onSave, canEdit }: ReadmeEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleSave = () => {
    onSave(editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown-like rendering
    return text
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold mb-4">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold mb-3">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-medium mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ')) {
          return (
            <li key={index} className="ml-4 list-disc">
              {line.slice(2)}
            </li>
          );
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="mb-2">{line}</p>;
      });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            README.md
          </CardTitle>
          {canEdit && !isEditing && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="mt-4">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="# Project Title

## Description
Describe your project here...

## Features
- Feature 1
- Feature 2
- Feature 3

## Installation
```
npm install
```

## Usage
```
npm start
```"
                className="min-h-[400px] font-mono"
              />
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              <div className="prose prose-sm max-w-none border rounded p-4 min-h-[400px]">
                {editContent ? renderMarkdown(editContent) : (
                  <p className="text-muted-foreground">No content to preview</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="prose prose-sm max-w-none">
            {content ? renderMarkdown(content) : (
              <p className="text-muted-foreground text-center py-8">
                No README content yet. {canEdit && "Click Edit to add content."}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { ReadmeEditor };