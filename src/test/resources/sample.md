# fmscriptui preview test

Open this file's Markdown preview (View > Editor Layout, or the preview icon) to check that
the fence below renders as a collapsible script accordion instead of a plain code block.

```filemaker-script
1. Allow User Abort [ Off ]
   → Allow user to abort: Off

2. Set Error Capture [ On ]
   → Capture errors: On

3. Set Variable [ $param ; Value: Get(ScriptParameter) ]
   → Name: $param
   → Value:
      Get ( ScriptParameter )

4. If [ $param ≠ "" ]
   → Condition:
      $param ≠ ""

5. # (comment) [ MAIN LOGIC ]

6. Set Variable [ $$total ; Value: Coverage of every highlighted token category ]
   → Name: $$total
   → Value:
      // a line comment
      /* a block comment */
      Let ( [
          $count = Round ( 3.14159 * 2e2 ; 1 ) ;
          $label = "quoted \"string\"" ;
          $tag = 'single \'quoted\'' ;
          $ok = True and not False
      ] ;
          If ( $count >= 100 and $count <= 999 ; GetAsText ( $count ) ; "" )
      )

7. Perform Script [ "Cleanup" ] *(disabled)*

Exit Script [ Result: 1 ]
   → Result: 1
```

Edit a step above while the preview is open — the accordion should update live without
needing to close and reopen the preview.
