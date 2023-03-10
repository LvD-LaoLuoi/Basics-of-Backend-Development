const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { JWT_SECRET, AUTH } = require('../configs/env');
const User = require('../models/User');
const LocalStrategy = require('passport-local').Strategy;
const GoogleTokenStrategy = require('passport-google-token').Strategy;
const FacebookTokenStrategy = require('passport-facebook-token');

// Passport Jwt
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken('Authorization'),
  secretOrKey: `${JWT_SECRET}`,
};

passport.use(
  new JwtStrategy(opts, async (payload, done) => {
    try {
      const user = await User.findById(payload.sub);

      if (!user) return done(null, false);
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  })
);

// Passport local
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });

        if (!user) return done(null, false);

        const isCorrectPassword = await user.isValidPassword(password);
        if (!isCorrectPassword) return done(null, false);
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

// Passport google
passport.use(
  new GoogleTokenStrategy(
    {
      clientID: `${AUTH.GOOGLE.CLIENT_ID}`,
      clientSecret: `${AUTH.GOOGLE.CLIENT_SECRET}`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // check whether this current user exists in our database
        const user = await User.findOne({ authSocialID: profile.id, authType: 'google' });
        if (user) return done(null, user);

        // create a new user and save
        const newUser = new User({
          firstName: profile.name.familyName,
          lastName: profile.name.givenName,
          authType: 'google',
          authSocialID: profile.id,
          email: profile.emails[0].value,
        });

        await newUser.save();
        done(null, newUser);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

// Passport Facebook
passport.use(
  new FacebookTokenStrategy(
    {
      clientID: `${AUTH.FACEBOOK.CLIENT_ID}`,
      clientSecret: `${AUTH.FACEBOOK.CLIENT_SECRET}`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await User.findOne({ authSocialID: profile.id, authType: 'facebook' });
        if (user) return done(null, user);

        // create a new user and save
        const newUser = new User({
          firstName: profile.name.familyName,
          lastName: profile.name.givenName,
          authType: 'facebook',
          authSocialID: profile.id,
          email: profile.emails[0].value,
        });

        await newUser.save();
        done(null, newUser);
      } catch (error) {
        done(error, false);
      }
    }
  )
);
