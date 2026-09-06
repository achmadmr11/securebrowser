package com.examedu.securebrowser

import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Context
import android.os.Bundle
import android.text.InputType
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var welcomeLayout: View
    private lateinit var tvWelcomeTitle: TextView

    private val CBT_URL = "https://cbtportal.smapluspgri.sch.id/"
    private val ADMIN_PASSWORD = "admin123" // Password to change settings

    private var isExamStarted = false

    // Tap exit detection
    private var tapCount = 0
    private var lastTapTime: Long = 0
    private var lastTapX = 0f
    private var lastTapY = 0f
    private val TAP_TIMEOUT = 500L
    private val MAX_TAP_DISTANCE = 100f

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Prevent screenshots and screen recording
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )

        // Hide system UI (Fullscreen / Immersive mode)
        hideSystemUI()

        setContentView(R.layout.activity_main)

        // Initialize UI Elements
        webView = findViewById(R.id.webView)
        welcomeLayout = findViewById(R.id.welcomeLayout)
        tvWelcomeTitle = findViewById(R.id.tvWelcomeTitle)
        val ivLogo = findViewById<View>(R.id.ivLogo)

        val btnStartExam = findViewById<Button>(R.id.btnStartExam)

        // Set Saved App Title
        tvWelcomeTitle.text = getSavedTitle()

        // Set Click Listeners
        btnStartExam.setOnClickListener {
            startExam()
        }

        // Secret entry point: Long-click logo to open admin settings
        ivLogo.setOnLongClickListener {
            showAdminSettingsDialog()
            true
        }

        setupWebView()

        // Start Kiosk Mode (Screen Pinning)
        startLockTask()

        // Handle Back Press to prevent exiting
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (isExamStarted) {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        Toast.makeText(this@MainActivity, "Tidak dapat keluar dari ujian. Ketuk 6 kali untuk opsi keluar.", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    Toast.makeText(this@MainActivity, "Gunakan menu untuk navigasi. Ketuk 6 kali untuk keluar aplikasi.", Toast.LENGTH_SHORT).show()
                }
            }
        })
    }

    private fun setupWebView() {
        val webSettings: WebSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.loadWithOverviewMode = true
        webSettings.useWideViewPort = true

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                view?.loadUrl(url ?: return false)
                return true
            }
        }
        webView.webChromeClient = WebChromeClient()
    }

    private fun startExam() {
        val url = getSavedUrl()
        webView.loadUrl(url)
        welcomeLayout.visibility = View.GONE
        webView.visibility = View.VISIBLE
        isExamStarted = true
        Toast.makeText(this, "Memulai Ujian...", Toast.LENGTH_SHORT).show()
    }

    private fun getSavedUrl(): String {
        val sharedPref = getSharedPreferences("ExamEduPrefs", Context.MODE_PRIVATE)
        return sharedPref.getString("exam_url", CBT_URL) ?: CBT_URL
    }

    private fun saveUrl(url: String) {
        val sharedPref = getSharedPreferences("ExamEduPrefs", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putString("exam_url", url)
            apply()
        }
    }

    private fun getSavedTitle(): String {
        val sharedPref = getSharedPreferences("ExamEduPrefs", Context.MODE_PRIVATE)
        return sharedPref.getString("app_title", "Secure Exam Browser") ?: "Secure Exam Browser"
    }

    private fun saveTitle(title: String) {
        val sharedPref = getSharedPreferences("ExamEduPrefs", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putString("app_title", title)
            apply()
        }
    }

    private fun showAdminSettingsDialog() {
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            val padding = (16 * resources.displayMetrics.density).toInt()
            setPadding(padding, padding, padding, padding)
        }

        val etPassword = EditText(this).apply {
            hint = "Password Admin"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = (8 * resources.displayMetrics.density).toInt()
            }
        }

        val etLink = EditText(this).apply {
            hint = "Link Ujian"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI
            setText(getSavedUrl())
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = (8 * resources.displayMetrics.density).toInt()
            }
        }

        val etTitle = EditText(this).apply {
            hint = "Judul Aplikasi"
            inputType = InputType.TYPE_CLASS_TEXT
            setText(getSavedTitle())
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        container.addView(etPassword)
        container.addView(etLink)
        container.addView(etTitle)

        AlertDialog.Builder(this)
            .setTitle("Pengaturan Admin")
            .setView(container)
            .setPositiveButton("Simpan") { _, _ ->
                val password = etPassword.text.toString()
                val newUrl = etLink.text.toString().trim()
                val newTitle = etTitle.text.toString().trim()

                if (password == ADMIN_PASSWORD) {
                    var updated = false
                    if (newUrl.isNotEmpty()) {
                        saveUrl(newUrl)
                        updated = true
                    }
                    if (newTitle.isNotEmpty()) {
                        saveTitle(newTitle)
                        tvWelcomeTitle.text = newTitle
                        updated = true
                    }
                    if (updated) {
                        Toast.makeText(this, "Pengaturan berhasil diperbarui!", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    Toast.makeText(this, "Password salah!", Toast.LENGTH_SHORT).show()
                }
                hideSystemUI()
            }
            .setNegativeButton("Batal") { dialog, _ ->
                dialog.dismiss()
                hideSystemUI()
            }
            .setCancelable(false)
            .show()
    }

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        if (ev.action == MotionEvent.ACTION_DOWN) {
            val currentTime = System.currentTimeMillis()
            val x = ev.x
            val y = ev.y

            val distance = Math.sqrt(
                Math.pow((x - lastTapX).toDouble(), 2.0) +
                Math.pow((y - lastTapY).toDouble(), 2.0)
            )

            if (currentTime - lastTapTime < TAP_TIMEOUT && distance < MAX_TAP_DISTANCE) {
                tapCount++
            } else {
                tapCount = 1
            }

            lastTapTime = currentTime
            lastTapX = x
            lastTapY = y

            if (tapCount == 6) {
                tapCount = 0
                showTapExitDialog()
            }
        }
        return super.dispatchTouchEvent(ev)
    }

    private fun showTapExitDialog() {
        val input = EditText(this).apply {
            hint = "Password Keluar"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        }

        AlertDialog.Builder(this)
            .setTitle("Keluar Ujian")
            .setMessage("Masukkan password untuk keluar dari ujian:")
            .setView(input)
            .setPositiveButton("Keluar") { _, _ ->
                val enteredPassword = input.text.toString()
                if (enteredPassword == "keluar123") {
                    stopLockTask()
                    finishAndRemoveTask()
                } else {
                    Toast.makeText(this, "Password salah!", Toast.LENGTH_SHORT).show()
                    hideSystemUI()
                }
            }
            .setNegativeButton("Batal") { dialog, _ ->
                dialog.dismiss()
                hideSystemUI()
            }
            .setCancelable(false)
            .show()
    }

    private fun hideSystemUI() {
        window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN)
    }

    override fun onResume() {
        super.onResume()
        hideSystemUI()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }
}
