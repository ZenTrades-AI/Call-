
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import { Save, Key } from "lucide-react";

export default function ApiKeySettings() {
  const [apiKey, setApiKey] = useState(localStorage.getItem("openai_api_key") || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    
    try {
      if (!apiKey.trim()) {
        localStorage.removeItem("openai_api_key");
        toast.info("API key removed");
      } else {
        localStorage.setItem("openai_api_key", apiKey.trim());
        toast.success("API key saved successfully");
      }
    } catch (error) {
      toast.error("Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenAI API Key
        </CardTitle>
        <CardDescription>
          Enter your OpenAI API key for appointment extraction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="font-mono"
          />
          <p className="text-xs text-gray-500">
            Your API key is stored locally in your browser and is never sent to our servers.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Save API Key
        </Button>
      </CardFooter>
    </Card>
  );
}
