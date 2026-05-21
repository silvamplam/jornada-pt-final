-- Jornada.pt - sugestoes de logotipos para canais TV
-- Executar no Supabase SQL Editor se quiseres preencher varios canais de uma vez.
-- As linhas que nao tiverem canal correspondente na base de dados nao alteram nada.

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV1_(2023).svg'
where lower(name) in ('sport tv 1', 'sporttv 1');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV2_(2023).svg'
where lower(name) in ('sport tv 2', 'sporttv 2');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV3_(2023).svg'
where lower(name) in ('sport tv 3', 'sporttv 3');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV4_(2023).svg'
where lower(name) in ('sport tv 4', 'sporttv 4');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV5_(2023).svg'
where lower(name) in ('sport tv 5', 'sporttv 5');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV6_(2023).svg'
where lower(name) in ('sport tv 6', 'sporttv 6');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV7_(2024).png'
where lower(name) in ('sport tv 7', 'sporttv 7');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV%2B_(2023).svg'
where lower(name) in ('sport tv+', 'sport tv plus', 'sporttv+');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DAZN_logo.svg'
where lower(name) = 'dazn';

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DAZN_1_2024.svg'
where lower(name) = 'dazn 1';

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DAZN_2_2024.svg'
where lower(name) = 'dazn 2';

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DAZN_3_2024.svg'
where lower(name) = 'dazn 3';

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DAZN_4_2024.svg'
where lower(name) = 'dazn 4';

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DAZN_5.svg'
where lower(name) = 'dazn 5';

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DAZN_6.svg'
where lower(name) = 'dazn 6';

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/ELEVEN_SPORTS_Logo.svg'
where lower(name) in ('eleven', 'eleven sports', 'eleven 1', 'eleven sports 1');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Logo_Canal_11_FPF_1.svg'
where lower(name) in ('canal 11', 'canal11');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/BTV_Red.svg'
where lower(name) in ('btv', 'benfica tv');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/RTP_2026.svg'
where lower(name) = 'rtp';

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/RTP1_2026.svg'
where lower(name) in ('rtp 1', 'rtp1');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/RTP2_logo_2016.svg'
where lower(name) in ('rtp 2', 'rtp2');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/RTP3_logo.svg'
where lower(name) in ('rtp 3', 'rtp3');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/RTP_Not%C3%ADcias_2026.svg'
where lower(name) in ('rtp noticias', 'rtp notícias', 'rtp noticias 2026', 'rtp notícias 2026');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/SIC_Not%C3%ADcias_(2023).svg'
where lower(name) in ('sic noticias', 'sic notícias', 'sic noticias hd', 'sic notícias hd');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/SIC_Mulher_2023.svg'
where lower(name) in ('sic mulher');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Log%C3%B3tipo_TVI.png'
where lower(name) = 'tvi';

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/TVI_Fic%C3%A7%C3%A3o_(2017).png'
where lower(name) in ('tvi ficcao', 'tvi ficção');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/TVI_Reality_(2017).png'
where lower(name) in ('tvi reality');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/CNN_Portugal.svg'
where lower(name) in ('cnn portugal', 'cnn pt');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/CMTV.jpg'
where lower(name) in ('cmtv', 'cm tv');
