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
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.MimeTypeMap;
import java.net.URLDecoder;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipEntry;
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
    private File stagedMedia;
    private OutputStream mediaWrite;
    private OutputStream videoStream;
    private String pendingVideoName;
    private String pendingVideoMime;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
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
        browser.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request){
                Uri uri=request.getUrl();
                if(!"cm-media.invalid".equals(uri.getHost()))return super.shouldInterceptRequest(view,request);
                try{
                    String type=uri.getPathSegments().get(0);
                    String file=uri.getLastPathSegment();
                    if(!(type.equals("music")||type.equals("hit")||type.equals("parry")))return null;
                    File f=new File(new File(getFilesDir(),"user_media/"+type),safeMediaName(file));
                    if(!f.isFile()||!f.getCanonicalPath().startsWith(new File(getFilesDir(),"user_media/"+type).getCanonicalPath()+File.separator))return null;
                    String ext=file.substring(file.lastIndexOf('.')+1).toLowerCase(java.util.Locale.US);
                    String mime=ext.equals("mp3")?"audio/mpeg":ext.equals("wav")?"audio/wav":"audio/ogg";
                    java.util.Map<String,String> headers=new java.util.HashMap<>();headers.put("Access-Control-Allow-Origin","*");headers.put("Accept-Ranges","bytes");
                    return new WebResourceResponse(mime,null,200,"OK",headers,new FileInputStream(f));
                }catch(Exception e){android.util.Log.w("CupheadMascot","Audio local indisponível: "+e.getMessage());return null;}
            }
        });
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
        synchronized(this){try{if(videoStream!=null)videoStream.close();}catch(Exception ignored){}videoStream=null;
          try{if(mediaWrite!=null)mediaWrite.close();}catch(Exception ignored){}mediaWrite=null;}
        if(browser!=null){browser.removeJavascriptInterface("Android");browser.destroy();browser=null;}
        super.onDestroy();
    }
    private String projectName(String s){return s.replaceAll("[^\\p{L}\\p{N}_ -]", "_").trim().replaceAll(" +"," ");}
    private File projectDir(){File f=new File(getFilesDir(),"projects");if(!f.exists())f.mkdirs();return f;}
    private String safeMediaName(String name){
        String n=new File(name).getName().replaceAll("[^a-zA-Z0-9_ .()\\-\\p{L}]","_");
        if(n.length()>105)n=n.substring(n.length()-105);
        return n.isEmpty()?"audio.mp3":n;
    }
    private File mediaDir(String type){File f=new File(getFilesDir(),"user_media/"+type);if(!f.exists())f.mkdirs();return f;}
    private boolean addImportedMedia(InputStream input,String filename,long maxBytes)throws Exception{
        String name=safeMediaName(filename),lower=name.toLowerCase(java.util.Locale.US);
        String type;
        if(lower.matches(".*\\.(mp3|ogg)$"))type="music";
        else if(lower.endsWith(".wav")&&lower.contains("parry"))type="parry";
        else if(lower.endsWith(".wav")&&lower.contains("hit"))type="hit";
        else return false;
        File target=new File(mediaDir(type),name);
        long total=0;
        try(OutputStream out=new FileOutputStream(target)){
            byte[] buf=new byte[32768];int n;
            while((n=input.read(buf))!=-1){total+=n;if(total>maxBytes)throw new Exception("Arquivo maior que o limite");out.write(buf,0,n);}
        }catch(Exception e){target.delete();throw e;}
        return true;
    }
    public final class StorageBridge {
        @JavascriptInterface public synchronized String beginMediaImport(String name){
            try{if(mediaWrite!=null)mediaWrite.close();
                stagedMedia=new File(getCacheDir(),"imported_"+System.nanoTime()+"_"+safeMediaName(name));
                mediaWrite=new FileOutputStream(stagedMedia);return "OK";
            }catch(Exception e){return e.getMessage();}
        }
        @JavascriptInterface public synchronized String appendMediaImport(String data){
            try{if(mediaWrite==null||stagedMedia==null)return "Inicie a importação";
                if(stagedMedia.length()>95000000)return "Limite de 95 MB por arquivo";
                mediaWrite.write(android.util.Base64.decode(data,android.util.Base64.DEFAULT));return "OK";
            }catch(Exception e){return e.getMessage();}
        }
        @JavascriptInterface public synchronized String finishMediaImport(){
            try{
                if(stagedMedia==null||mediaWrite==null)return "Nenhuma importação";
                mediaWrite.close();mediaWrite=null;
                String name=stagedMedia.getName(),lower=name.toLowerCase(java.util.Locale.US);
                int count=0;
                if(lower.endsWith(".zip")){
                    try(ZipInputStream zi=new ZipInputStream(new FileInputStream(stagedMedia))){
                        ZipEntry entry;
                        while((entry=zi.getNextEntry())!=null){
                            if(!entry.isDirectory()&&count<80&&addImportedMedia(zi,entry.getName(),18000000))count++;
                            zi.closeEntry();
                        }
                    }
                }else{
                    try(InputStream fi=new FileInputStream(stagedMedia)){if(addImportedMedia(fi,name.replaceFirst("^imported_[0-9]+_",""),18000000))count++;}
                }
                stagedMedia.delete();stagedMedia=null;
                return count>0?"OK: "+count+" arquivo(s)":"Nenhuma faixa ou efeito suportado encontrado";
            }catch(Exception e){if(stagedMedia!=null)stagedMedia.delete();stagedMedia=null;return e.getMessage();}
        }
        @JavascriptInterface public synchronized String cancelMediaImport(){
            try{if(mediaWrite!=null)mediaWrite.close();}catch(Exception ignored){}
            mediaWrite=null;if(stagedMedia!=null)stagedMedia.delete();stagedMedia=null;return "OK";
        }
        @JavascriptInterface public String listImportedMedia(){
            JSONArray items=new JSONArray();
            for(String type:new String[]{"music","hit","parry"}){
                File[] fs=mediaDir(type).listFiles();if(fs==null)continue;
                Arrays.sort(fs, (a,b)->a.getName().compareToIgnoreCase(b.getName()));
                for(File f:fs){if(!f.isFile())continue;JSONObject obj=new JSONObject();
                    try{obj.put("type",type);obj.put("name",f.getName());obj.put("size",f.length());items.put(obj);}catch(Exception ignored){}
                }
            }
            return items.toString();
        }
        @JavascriptInterface public String importedMediaUrl(String type,String name){
            if(!(type.equals("music")||type.equals("hit")||type.equals("parry")))return "";
            return "https://cm-media.invalid/"+type+"/"+Uri.encode(safeMediaName(name));
        }
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
