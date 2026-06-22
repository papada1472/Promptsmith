import { exec } from "child_process";

function checkActiveElementIsEditable() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const psCommand = `powershell -NoProfile -NonInteractive -WindowStyle Hidden -Command "
      Add-Type -AssemblyName UIAutomationClient;
      try {
        $el = [System.Windows.Automation.AutomationElement]::FocusedElement;
        if ($el -eq $null) { Write-Host 'false'; exit; }
        $type = $el.Current.ControlType.ProgrammaticName;
        $class = $el.Current.ClassName;
        
        $isEdit = ($type -eq 'ControlType.Edit') -or 
                  ($type -eq 'ControlType.ComboBox') -or 
                  (($type -eq 'ControlType.Document') -and ($class -notlike '*Chrome_RenderWidgetHostHWND*') -and ($class -notlike '*RenderWidgetHostHWND*'));
                  
        if ($isEdit) {
          Write-Host 'true';
        } else {
          $valPattern = $null;
          if ($el.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$valPattern)) {
            if (-not $valPattern.Current.IsReadOnly) {
              Write-Host 'true';
              exit;
            }
          }
          Write-Host 'false';
        }
      } catch {
        Write-Host 'false';
      }
    "`;
    
    exec(psCommand, (error, stdout) => {
      const elapsed = Date.now() - startTime;
      console.log(`Command elapsed time: ${elapsed}ms`);
      if (error) {
        console.error("Focused element check error:", error);
        resolve(false);
        return;
      }
      const res = stdout.trim().toLowerCase();
      resolve({ isEditable: res === "true", elapsed });
    });
  });
}

checkActiveElementIsEditable().then((result) => {
  console.log("Result:", result);
});
