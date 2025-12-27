![stellar dragoon logo banner](static/readme-banner.png)

# ステラグーン CHRONICLE

sorted from newest.

### saturday 27122025

Theatre.jsで演出させる前に、できるだけたくさんの「武器」（アセット）を実験しておきたい\
/orbit で実験 (/orbital-fragments から変更)

やっとthrelte、shaders、postprocessingが動ける環境が整った\

/orbit の実験場が整った\
state.svelte.tsでグローバル状態管理を実装した\
UI.svelteで&lt;dialog&gt;を使ったモーダルを実装した\
これから、色々なobject, shader, postprocessingをUIで組み合わせて操作できるようにする\
そしていっぱい実験する

Svelte 5のスタックってかなり新しいね\
threlte-postprocessingというライブラリもまだ今年出たばっかり\
でも割と操作しやすいし、エラーも少ない\
まあ、新しいスタックだから、強いAI使わないと頼りにならないから、自分で理解していかないといけないけど

### thursday 25122025

こんにちは、ｒｉｏｚｅです\
大学の冬休みの２日目\
外はどんよりしている

今すぐCloudflareで静的で稼働させる\
アセットを守るためにR2的なストレージに置く予定

pkgマネージャーはyarnにした

src/routes/+layout.tsを追加した\
静的ビルドのために

実験用のルートは /orbital-fragments にした
軌道上で浮遊してる世界の欠片

tailwindのlayout.cssは@theme専用\
rootテーマなどは各コンポーネントへ

バイト中に暗号化テックニック思いついた\
クラウドにアップしたアセットを全部暗号化し\
クライアントからそれを復号化させて表示させる\
復号スクリプトはworkerのビルド環境変数に置けばいい\
復号はweb workerでやって、表示はcanvasで描画すれば保存不可能\
まじで天才

mdって行の最後に\\を付けないと改行されないよね\
めんどくさい

よろしくお願いします。
