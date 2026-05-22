-- Passo 2 - logotipos dos canais TV

insert into public.broadcast_channels (name, platform, country, logo_url)
select 'Sport TV 1', 'Sport TV', 'Portugal', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV1_(2023).svg'
where not exists (select 1 from public.broadcast_channels where lower(name) in ('sport tv 1', 'sporttv 1'));

insert into public.broadcast_channels (name, platform, country, logo_url)
select 'Sport TV 2', 'Sport TV', 'Portugal', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV2_(2023).svg'
where not exists (select 1 from public.broadcast_channels where lower(name) in ('sport tv 2', 'sporttv 2'));

insert into public.broadcast_channels (name, platform, country, logo_url)
select 'Sport TV 3', 'Sport TV', 'Portugal', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV3_(2023).svg'
where not exists (select 1 from public.broadcast_channels where lower(name) in ('sport tv 3', 'sporttv 3'));

insert into public.broadcast_channels (name, platform, country, logo_url)
select 'DAZN 1', 'DAZN', 'Portugal', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DAZN_1_2024.svg'
where not exists (select 1 from public.broadcast_channels where lower(name) = 'dazn 1');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV1_(2023).svg'
where lower(name) in ('sport tv 1', 'sporttv 1') and (logo_url is null or logo_url = '');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV2_(2023).svg'
where lower(name) in ('sport tv 2', 'sporttv 2') and (logo_url is null or logo_url = '');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sport_TV3_(2023).svg'
where lower(name) in ('sport tv 3', 'sporttv 3') and (logo_url is null or logo_url = '');

update public.broadcast_channels
set logo_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DAZN_1_2024.svg'
where lower(name) = 'dazn 1' and (logo_url is null or logo_url = '');
