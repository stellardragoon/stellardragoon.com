![stellar dragoon logo banner](static/readme-banner.png)

# ステラグーン CHRONICLE

sorted from newest.

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
