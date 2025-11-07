<?php
/**
 * Plugin Name: FWF Map Embed
 * Description: Nhúng bản đồ hệ thống Face Wash Fox vào WordPress bằng shortcode [fwf_map]
 * Version: 1.0.2
 * Author: Le Hoang Anh
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Register shortcode: [fwf_cuahang]
add_shortcode('fwf_map', function () {
  return '
    <style>
      iframe[src*="cuahang.facewashfox.com"] {
        width: 100% !important;
        border: none !important;
        display: block !important;
        scrollbar-width: none;
        -ms-overflow-style: none;
        transition: height .25s ease-out;
      }
      iframe[src*="cuahang.facewashfox.com"]::-webkit-scrollbar {
        display: none;
      }
      .fwf-embed-page, .fwf-embed-wrap {
        width: 100% !important;
      }
    </style>

    <div class="fwf-embed-page">
      <div class="fwf-embed-wrap">
        <iframe 
          src="https://cuahang.facewashfox.com/"
          scrolling="no"
          allow="geolocation"
        ></iframe>
      </div>
    </div>

    <script>
      window.addEventListener("message", function(event) {
        if (event.data.type === "setHeight") {
          const iframe = document.querySelector("iframe[src*=\'cuahang.facewashfox.com\']");
          if (!iframe) return;
          iframe.style.height = event.data.height + "px";
        }
      });
    </script>
  ';
});


function fwf_cuahang_shortcode($atts) {
    ob_start();
    ?>
    <style>
      .fwf-embed-page { position: relative; width:100%; overflow:visible; background:#f8fafc; }
      .fwf-embed-wrap { position: relative; width:100%; }
      .fwf-embed-wrap iframe { 
        width:100%; 
        border:0; 
        scrollbar-width:none; 
        -ms-overflow-style:none; 
        transition: height .25s ease-out;
      }
      .fwf-embed-wrap iframe::-webkit-scrollbar { display:none; }
    </style>

    <div class="fwf-embed-page">
      <div class="fwf-embed-wrap">
        <iframe
          src="https://cuahang.facewashfox.com/"
          loading="eager"
          allow="geolocation 'self'; clipboard-write; fullscreen"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"

          width="100%"
    
    style="border:none; overflow:hidden;"
    scrolling="no"
        ></iframe>
      </div>
    </div>

    <!-- Nút lấy vị trí đã được ẩn vì tự động lấy vị trí -->
    <div id="fwf-location-status" style="position:fixed;bottom:16px;right:16px;z-index:99999;background:#28a745;color:#fff;padding:8px 12px;border-radius:6px;font-size:12px;font-weight:600;display:none;">
      ✅ Đã lấy vị trí
    </div>

    <script>
    (function(){
      var statusDiv = document.getElementById('fwf-location-status');
      var iframe = document.querySelector('.fwf-embed-wrap iframe');
      if(!iframe) return;
      
      function requestLocation(){
        if(!navigator.geolocation){ 
          console.log('❌ Không hỗ trợ định vị');
          return; 
        }
        
        console.log('📍 Đang tự động lấy vị trí...');
        
        navigator.geolocation.getCurrentPosition(
          function(pos){
            var payload = { 
              type:'fwf:setLocation', 
              lat: pos.coords.latitude, 
              lng: pos.coords.longitude 
            };
            try { 
              iframe.contentWindow.postMessage(payload, '*'); 
              console.log('✅ Đã lấy vị trí:', pos.coords.latitude, pos.coords.longitude);
              
              // Hiển thị status ngắn gọn
              if(statusDiv) {
                statusDiv.style.display = 'block';
                setTimeout(function(){
                  statusDiv.style.display = 'none';
                }, 3000);
              }
            }
            catch(e){ 
              console.log('❌ Lỗi gửi dữ liệu:', e);
            }
          }, 
          function(error){
            console.log('❌ Lỗi geolocation:', error.code, error.message);
            // Không hiển thị lỗi cho user, chỉ log để debug
          }, 
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 300000 
          }
        );
      }
      
      // Lắng nghe message từ iframe để cập nhật chiều cao
      window.addEventListener("message", function(event) {
        if (event.data.type === "setHeight") {
          iframe.style.height = event.data.height + "px";
        }
      });
      
      // Tự động lấy vị trí ngay khi iframe load xong
      iframe.addEventListener('load', function(){
        setTimeout(requestLocation, 500);
      });
      
      // Fallback: nếu iframe đã load sẵn
      if(iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        setTimeout(requestLocation, 500);
      }
    })();
    </script>
    <?php
    return ob_get_clean();
}

// Set Permissions-Policy and other security headers to allow geolocation for the iframe origin
add_action('send_headers', function(){
    header('Permissions-Policy: geolocation=(self "https://cuahang.facewashfox.com" "https://cua-hang-vua-dev.vercel.app"), camera=(), microphone=()');
    header('X-Frame-Options: ALLOWALL');

    header('Referrer-Policy: strict-origin-when-cross-origin');
}, 1000);

add_filter('widget_text', 'do_shortcode');
add_filter('the_content', 'do_shortcode');

