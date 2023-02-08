create table if not exists "user"(
  userid uuid default uuid_generate_v4(),
  twitterid varchar(255),
  githubid varchar(255),
  discordid varchar(255),
  username varchar(255),
  email varchar(255) not null,
  avatarurl varchar(255) not null,
  displayname varchar(255),
  bannerurl varchar(255),
  bio text,
  numfollowing int,
  numfollowers int,
  online boolean,
  lastonline boolean,
  muted boolean default false,
  deafened boolean default false,
  Primary Key(userid)
);

create table if not exists room(
   roomid uuid default uuid_generate_v4(),
   roomname varchar(50) not null,
   roomdesc text,
   isprivate boolean,
   autospeaker boolean,
   creatorid uuid,
   Primary Key(roomid),
   Foreign Key(creatorid) references "user"(userid) on delete cascade
);

create table if not exists room_status(
   roomid uuid,
   userid uuid,
   ismute boolean,
   isdeafened boolean
);

create table if not exists room_permission(
   roomid uuid not null,
   userid uuid not null, 
   isspeaker boolean,
   ismod boolean,
   askedtospeak boolean,
   Primary Key(roomid, userid)
);
