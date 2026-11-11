import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LobbyComponent } from './lobby.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { vi } from 'vitest';

describe('LobbyComponent', () => {
  let component: LobbyComponent;
  let fixture: ComponentFixture<LobbyComponent>;
  let router: Router;

  const routerSpy = {
    navigate: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        NoopAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        LobbyComponent
      ],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LobbyComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    routerSpy.navigate.mockClear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to the room with user name and room id', () => {
    component.userName = 'testUser';
    component.roomId = 'testRoom';
    component.joinRoom();
    expect(router.navigate).toHaveBeenCalledWith(['/room', 'testRoom', 'testUser']);
  });

  it('should navigate to the room with a generated id if user name is not provided', () => {
    component.roomId = 'testRoom';
    component.userName = '';
    component.joinRoom();
    const navigatedArgs = routerSpy.navigate.mock.calls[0][0];
    expect(navigatedArgs[0]).toBe('/room');
    expect(navigatedArgs[1]).toBe('testRoom');
    expect(navigatedArgs[2]).toMatch(/^[a-z0-9]{8}$/);
  });

  it('should not navigate if room id is not provided', () => {
    component.roomId = '';
    component.joinRoom();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should have a disabled button if room id is not provided', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
  });

  it('should have an enabled button if room id is provided', async () => {
    component.roomId = 'testRoom';
    fixture.detectChanges();
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(false);
  });
});
