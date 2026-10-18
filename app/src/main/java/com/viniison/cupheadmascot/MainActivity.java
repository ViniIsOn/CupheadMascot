package com.viniison.cupheadmascot;

import android.app.Activity;
import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Environment;
import android.content.ContentValues;
import android.provider.MediaStore;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.ValueCallback;
import android.webkit.WebViewClient;
import android.webkit.ConsoleMessage;
import android.widget.Toast;

import org.json.JSONObject;
import org.json.JSONArray;

import java.io.File;
import java.io.FileOutputStream;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Arrays;
import java.util.ArrayList;

public final class MainActivity extends Activity {
    private static final int FILE_PICKER_REQUEST = 2003;
    private WebView browser;
    private ValueCallback<Uri[]> fileCallback;
    private File pendingVideo;
    private OutputStream videoStream;
    private String pendingVideoName;
    private String pendingVideoMime;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        browser = new WebView(this);
        browser.setBackgroundColor(0xff0e1220);
        WebSettings settings=browser.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setDefaultTextEncodingName("utf-8");
        browser.setWebViewClient(new WebViewClient());
        browser.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if(fileCallback!=null) fileCallback.onReceiveValue(null);
                fileCallback=callback;
                Intent intent;
                try { intent=params.createIntent(); }
                catch(Exception ex) { intent=new Intent(Intent.ACTION_GET_CONTENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE); }
                try { startActivityForResult(intent, FILE_PICKER_REQUEST); }
                catch(ActivityNotFoundException ex) { fileCallback.onReceiveValue(null); fileCallback=null; Toast.makeText(MainActivity.this, "Nenhum seletor de imagem disponível",Toast.LENGTH_LONG).show(); }
                return true;
            }
            @Override public boolean onConsoleMessage(ConsoleMessage msg) {
                android.util.Log.d("CupheadMascot", msg.message()+" ("+msg.lineNumber()+")");return true;
            }
        });
        browser.addJavascriptInterface(new StorageBridge(),"Android");
        setContentView(browser);
        browser.loadUrl("file:///android_asset/index.html");
    }

    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==FILE_PICKER_REQUEST){
            if(fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileCallback=null;}
        }
    }
    @Override public void onBackPressed(){
        if (browser != null) {
            browser.evaluateJavascript("if(!document.getElementById('modal').classList.contains('hidden'))closeModal();else if(document.body.classList.contains('playing'))stopGame();else alertModal('CupheadMascot','<p>Salve seu chefão antes de sair do aplicativo.</p>');", null);
        } else super.onBackPressed();
    }
    @Override protected void onDestroy(){
        synchronized(this){try{if(videoStream!=null)videoStream.close();}catch(Exception ignored){}videoStream=null;}
        if(browser!=null){browser.removeJavascriptInterface("Android");browser.destroy();browser=null;}
        super.onDestroy();
    }
    private String projectName(String s){return s.replaceAll("[^\\p{L}\\p{N}_ -]", "_").trim().replaceAll(" +"," ");}
    private File projectDir(){File f=new File(getFilesDir(),"projects");if(!f.exists())f.mkdirs();return f;}
    public final class StorageBridge {
        @JavascriptInterface public String saveProject(String json){
            try{JSONObject obj=new JSONObject(json);String n=projectName(obj.optString("bossName","Chefao"));if(n.length()==0)n="Chefao";if(n.length()>35)n=n.substring(0,35);File out=new File(projectDir(),n+".json");try(FileOutputStream stream=new FileOutputStream(out)){stream.write(json.getBytes(StandardCharsets.UTF_8));}return "OK";}
            catch(Exception e){return e.getMessage();}
        }
        @JavascriptInterface public String listProjects(){
            JSONArray result=new JSONArray();File[] files=projectDir().listFiles((dir,name)->name.endsWith(".json"));if(files!=null){Arrays.sort(files,(a,b)->Long.compare(b.lastModified(),a.lastModified()));for(File f:files)result.put(f.getName().replaceFirst("\\.json$",""));}return result.toString();
        }
        @JavascriptInterface public String loadProject(String name){
            try{File f=new File(projectDir(),projectName(name)+".json");if(!f.exists()||!f.getCanonicalPath().startsWith(projectDir().getCanonicalPath()+File.separator))return "";try(FileInputStream in=new FileInputStream(f)){byte[] data=new byte[(int)f.length()];int pos=0;while(pos<data.length){int n=in.read(data,pos,data.length-pos);if(n<0)break;pos+=n;}return new String(data,0,pos,StandardCharsets.UTF_8);}}
            catch(Exception e){return "";}
        }
        @JavascriptInterface public String deleteProject(String name){
            try{File f=new File(projectDir(),projectName(name)+".json");if(f.getCanonicalPath().startsWith(projectDir().getCanonicalPath()+File.separator))return f.delete()?"OK":"Erro";return "Erro";}
            catch(Exception e){return "Erro";}
        }
        @JavascriptInterface public synchronized String startVideo(String name,String mime){
            try{
                if(videoStream!=null){videoStream.close();videoStream=null;}
                pendingVideo=new File(getCacheDir(),"recording.temp");
                pendingVideoName=projectName(name);if(!pendingVideoName.endsWith(".webm"))pendingVideoName+=".webm";
                pendingVideoMime="video/webm";
                videoStream=new FileOutputStream(pendingVideo,false);
                return "OK";
            }catch(Exception e){return "Falha em iniciar: "+e.getMessage();}
        }
        @JavascriptInterface public synchronized String appendVideo(String data){
            if(videoStream==null)return "Nenhuma gravação ativa";
            try{videoStream.write(android.util.Base64.decode(data,android.util.Base64.DEFAULT));return "OK";}
            catch(Exception e){return "Falha na gravação: "+e.getMessage();}
        }
        @JavascriptInterface public synchronized String finishVideo(){
            if(videoStream==null||pendingVideo==null)return "Nenhuma gravação ativa";
            try{videoStream.close();videoStream=null;
                ContentValues values=new ContentValues();values.put(MediaStore.Video.Media.DISPLAY_NAME,pendingVideoName);values.put(MediaStore.Video.Media.MIME_TYPE,pendingVideoMime);values.put(MediaStore.Video.Media.RELATIVE_PATH,Environment.DIRECTORY_MOVIES+"/CupheadMascot");values.put(MediaStore.Video.Media.IS_PENDING,1);
                Uri uri=getContentResolver().insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI,values);
                if(uri==null)throw new Exception("Não foi possível criar vídeo no armazenamento");
                try(OutputStream stream=getContentResolver().openOutputStream(uri);InputStream input=new FileInputStream(pendingVideo)){
                   if(stream==null)throw new Exception("Saída não encontrada");byte[] buf=new byte[32768];int n;while((n=input.read(buf))!=-1)stream.write(buf,0,n);
                }
                values.clear();values.put(MediaStore.Video.Media.IS_PENDING,0);getContentResolver().update(uri,values,null,null);
                pendingVideo.delete();pendingVideo=null;
                runOnUiThread(()->{
                    try{Intent share=new Intent(Intent.ACTION_SEND);share.setType("video/webm");share.putExtra(Intent.EXTRA_STREAM,uri);share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);startActivity(Intent.createChooser(share,"Compartilhar gravação"));}
                    catch(Exception e){Toast.makeText(MainActivity.this,"Vídeo salvo em Filmes/CupheadMascot",Toast.LENGTH_LONG).show();}
                });
                return "OK";
            }catch(Exception e){return "Erro no armazenamento: "+e.getMessage();}
        }
    }
}
